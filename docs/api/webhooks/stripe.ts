/**
 * Vercel Serverless Function
 * Handles Stripe webhooks for RECURRING SUBSCRIPTIONS
 * 
 * Handled events:
 * - customer.subscription.created: Initial subscription
 * - invoice.payment_succeeded: Monthly renewal
 * - customer.subscription.updated: Plan change
 * - customer.subscription.deleted: Cancellation
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// ============================================================================
// HELPER: Initialize Supabase with service_role to write tokens
// ============================================================================
function getSupabaseClient() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase credentials');
    }

    return createClient(supabaseUrl, supabaseServiceKey);
}

// ============================================================================
// HELPER: Mapping Plan ID to credits
// ============================================================================
const PLAN_CREDITS: Record<number, { credits: number; name: string }> = {
    1: { credits: 25000, name: 'STARTER' },   // 2,500,000 tokens
    2: { credits: 100000, name: 'PRO' },      // 10,000,000 tokens
    3: { credits: 250000, name: 'ELITE' },    // 25,000,000 tokens
};

// ============================================================================
// HELPER: Add tokens to user
// ============================================================================
async function addTokensToUser(
    userId: string,
    credits: number,
    transactionType: string,
    description: string,
    referenceId?: string
): Promise<boolean> {
    const supabase = getSupabaseClient();
    const tokens = credits * 100; // Formula: tokens = credits × 100

    try {
        // Get current balance
        const { data: currentData } = await supabase
            .from('user_tokens')
            .select('tokens')
            .eq('user_id', userId)
            .single();

        const balanceBefore = currentData?.tokens || 0;
        const balanceAfter = balanceBefore + tokens;

        // Update token balance
        const { error: upsertError } = await supabase
            .from('user_tokens')
            .upsert({
                user_id: userId,
                tokens: balanceAfter,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id',
            });

        if (upsertError) {
            console.error('[Webhook] Error updating tokens:', upsertError);
            return false;
        }

        // Record in history (if table exists)
        try {
            await supabase.from('token_history').insert({
                user_id: userId,
                amount: tokens,
                balance_before: balanceBefore,
                balance_after: balanceAfter,
                transaction_type: transactionType,
                description,
                reference_id: referenceId,
                metadata: { credits, tokens },
            });
        } catch (historyError) {
            console.warn('[Webhook] History not available (optional)');
        }

        console.log(`[Webhook] ✅ Added ${tokens} tokens to user ${userId} (${credits} credits)`);
        return true;
    } catch (error) {
        console.error('[Webhook] Error addTokensToUser:', error);
        return false;
    }
}

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Verify Stripe is configured
        if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
            console.log('[Webhook] 📩 Mock webhook received (Stripe not configured)');
            const mockEvent = req.body;
            console.log('[Webhook] Mock event type:', mockEvent?.type || 'unknown');
            
            return res.status(200).json({ 
                received: true,
                message: 'MOCK: Webhook processed (Stripe not configured)' 
            });
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-02-24.acacia',
        });

        const sig = req.headers['stripe-signature'] as string;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

        if (!sig || !webhookSecret) {
            console.error('[Webhook] Missing signature or secret');
            return res.status(400).json({ error: 'Missing signature' });
        }

        // Verifica firma webhook
        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                sig,
                webhookSecret
            );
        } catch (err: any) {
            console.error('[Webhook] Signature verification failed:', err.message);
            return res.status(400).json({ error: 'Invalid signature' });
        }

        console.log('[Webhook] 📩 Event received:', event.type);

        // ====================================================================
        // SUBSCRIPTION EVENTS HANDLING
        // ====================================================================

        switch (event.type) {
            // ----------------------------------------------------------------
            // SUBSCRIPTION CREATED - Initial subscription
            // ----------------------------------------------------------------
            case 'customer.subscription.created': {
                const subscription = event.data.object as Stripe.Subscription;
                console.log('[Webhook] 🆕 New subscription:', subscription.id);

                const metadata = subscription.metadata || {};
                const userId = metadata.user_id;
                const planId = parseInt(metadata.plan_id || '0');
                const credits = parseInt(metadata.credits || '0');
                const customerId = subscription.customer as string;

                if (!userId || !planId || !credits) {
                    console.error('[Webhook] ⚠️ Missing metadata in subscription');
                    break;
                }

                const supabase = getSupabaseClient();

                // MIGRATION: Get user's organization
                const { data: membership } = await supabase
                    .from('organization_members')
                    .select('organization_id')
                    .eq('user_id', userId)
                    .limit(1)
                    .single();

                if (!membership) {
                    console.error('[Webhook] ❌ User has no organization');
                    break;
                }

                // Create subscription record for ORGANIZATION
                const { error: subError } = await supabase
                    .from('organization_subscriptions') // MIGRATED: organization-based subscriptions
                    .insert({
                        user_id: userId, // Audit: who created it
                        organization_id: membership.organization_id, // NEW: subscription owner
                        plan_id: planId,
                        status: 'active',
                        stripe_subscription_id: subscription.id,
                        stripe_customer_id: customerId,
                        started_at: new Date(subscription.created * 1000).toISOString(),
                        expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
                    });

                if (subError) {
                    console.error('[Webhook] ❌ Error creating subscription:', subError);
                    break;
                }

                // Add initial tokens
                const planInfo = PLAN_CREDITS[planId] || { credits, name: metadata.plan_name };
                await addTokensToUser(
                    userId,
                    credits,
                    'subscription_initial',
                    `${planInfo.name} Plan - Initial subscription`,
                    subscription.id
                );

                console.log('[Webhook] ✅ Organization subscription created and tokens assigned');
                break;
            }

            // ----------------------------------------------------------------
            // INVOICE PAID - Monthly renewal
            // ----------------------------------------------------------------
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                console.log('[Webhook] 💰 Payment received:', invoice.id);

                // Verify this is a subscription renewal (not the first payment)
                if (!invoice.subscription || invoice.billing_reason === 'subscription_create') {
                    console.log('[Webhook] ℹ️ First payment, tokens already assigned in subscription.created');
                    break;
                }

                const subscriptionId = invoice.subscription as string;
                
                // Retrieve subscription from Stripe to get metadata
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const metadata = subscription.metadata || {};
                const userId = metadata.user_id;
                const planId = parseInt(metadata.plan_id || '0');
                const credits = parseInt(metadata.credits || '0');

                if (!userId || !credits) {
                    console.error('[Webhook] ⚠️ Missing metadata in subscription');
                    break;
                }

                // Add monthly tokens (they accumulate!)
                const planInfo = PLAN_CREDITS[planId] || { credits, name: metadata.plan_name };
                await addTokensToUser(
                    userId,
                    credits,
                    'subscription_renewal',
                    `${planInfo.name} Plan - Monthly renewal`,
                    invoice.id
                );

                // Update subscription expiration date
                const supabase = getSupabaseClient();
                await supabase
                    .from('organization_subscriptions') // MIGRATED: organization-based subscriptions
                    .update({
                        expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
                    })
                    .eq('stripe_subscription_id', subscriptionId);

                console.log('[Webhook] ✅ Renewal processed, tokens added');
                break;
            }

            // ----------------------------------------------------------------
            // SUBSCRIPTION UPDATED - Plan change (upgrade/downgrade)
            // ----------------------------------------------------------------
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const previousAttributes = (event.data as any).previous_attributes;

                // Verify if there was a plan change (price change)
                if (!previousAttributes?.items) {
                    console.log('[Webhook] ℹ️ Subscription updated but no plan change');
                    break;
                }

                console.log('[Webhook] 🔄 Plan change subscription:', subscription.id);

                const metadata = subscription.metadata || {};
                const userId = metadata.user_id;
                const planId = parseInt(metadata.plan_id || '0');
                const credits = parseInt(metadata.credits || '0');

                if (!userId || !credits) {
                    console.error('[Webhook] ⚠️ Missing metadata');
                    break;
                }

                const supabase = getSupabaseClient();

                // Update subscription
                await supabase
                    .from('organization_subscriptions') // MIGRATED: organization-based subscriptions
                    .update({
                        plan_id: planId,
                        expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
                    })
                    .eq('stripe_subscription_id', subscription.id);

                // Add tokens from new plan (existing tokens are kept!)
                const planInfo = PLAN_CREDITS[planId] || { credits, name: metadata.plan_name };
                await addTokensToUser(
                    userId,
                    credits,
                    'subscription_upgrade',
                    `Changed to ${planInfo.name} plan`,
                    subscription.id
                );

                console.log('[Webhook] ✅ Plan change processed');
                break;
            }

            // ----------------------------------------------------------------
            // SUBSCRIPTION DELETED - Cancellation
            // ----------------------------------------------------------------
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                console.log('[Webhook] ❌ Subscription cancelled:', subscription.id);

                const supabase = getSupabaseClient();

                // Set status to cancelled (DO NOT remove tokens!)
                await supabase
                    .from('organization_subscriptions') // MIGRATED: organization-based subscriptions
                    .update({
                        status: 'cancelled',
                    })
                    .eq('stripe_subscription_id', subscription.id);

                console.log('[Webhook] ✅ Subscription cancelled (tokens kept)');
                break;
            }

            // ----------------------------------------------------------------
            // PAYMENT FAILED - Payment failed
            // ----------------------------------------------------------------
            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                console.log('[Webhook] ⚠️ Payment failed:', invoice.id);

                // TODO: Send notification email to user
                // TODO: Possibly suspend access after X attempts

                break;
            }

            // ----------------------------------------------------------------
            // PAYMENT INTENT SUCCEEDED - One-time payment successful
            // ----------------------------------------------------------------
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                console.log('[Webhook] ✅ Payment Intent succeeded:', paymentIntent.id);

                const metadata = paymentIntent.metadata || {};
                const userId = metadata.user_id;
                const credits = metadata.credits ? parseInt(metadata.credits) : null;
                const planId = metadata.plan_id ? parseInt(metadata.plan_id) : null;
                const planName = metadata.plan_name || 'One-time payment';

                // If credits are specified in metadata, add tokens to user
                if (userId && credits) {
                    const planInfo = planId ? PLAN_CREDITS[planId] : null;
                    const description = planInfo 
                        ? `${planInfo.name} Plan - One-time payment`
                        : `${planName} - One-time payment`;

                    await addTokensToUser(
                        userId,
                        credits,
                        'payment_one_time',
                        description,
                        paymentIntent.id
                    );

                    console.log('[Webhook] ✅ Tokens added for one-time payment');
                } else {
                    console.log('[Webhook] ℹ️ Payment succeeded but no credits to assign (metadata missing)');
                }

                // TODO: Send confirmation email to user
                // TODO: Update order/payment status in database if needed

                break;
            }

            // ----------------------------------------------------------------
            // PAYMENT INTENT PAYMENT FAILED - One-time payment failed
            // ----------------------------------------------------------------
            case 'payment_intent.payment_failed': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                console.log('[Webhook] ❌ Payment Intent failed:', paymentIntent.id);

                const metadata = paymentIntent.metadata || {};
                const userId = metadata.user_id;
                const email = metadata.email || paymentIntent.receipt_email;

                // Log failure reason
                if (paymentIntent.last_payment_error) {
                    console.error('[Webhook] Payment error:', {
                        code: paymentIntent.last_payment_error.code,
                        message: paymentIntent.last_payment_error.message,
                        type: paymentIntent.last_payment_error.type,
                    });
                }

                // TODO: Send notification email to user about failed payment
                // TODO: Log failure for analytics
                // TODO: Possibly retry payment if applicable

                break;
            }

            // ----------------------------------------------------------------
            // Other events
            // ----------------------------------------------------------------
            default:
                console.log('[Webhook] ℹ️ Unhandled event type:', event.type);
        }

        return res.status(200).json({ received: true });
    } catch (error: any) {
        console.error('[Webhook] ❌ Error processing webhook:', error);
        return res.status(500).json({ 
            error: 'Webhook processing failed',
            message: error.message 
        });
    }
}

// Configurazione specifica per Vercel: disabilita body parser
export const config = {
    api: {
        bodyParser: false,
    },
};

