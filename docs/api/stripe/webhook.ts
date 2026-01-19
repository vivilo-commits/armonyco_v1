/**
 * Vercel Serverless Function
 * Handles Stripe webhooks
 * 
 * Handled events:
 * - checkout.session.completed: Checkout completed (both payment and subscription)
 * - payment_intent.succeeded: One-time payment succeeded
 * - invoice.payment_succeeded: Subscription payment succeeded (renewal)
 * - invoice.payment_failed: Subscription payment failed
 * - customer.subscription.updated: Subscription updated (plan change, status change)
 * - customer.subscription.deleted: Subscription cancelled
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { addCreditsToOrganization } from '../../src/lib/credits';

// ============================================================================
// CONFIGURATION: Disable body parser to read raw body for signature validation
// ============================================================================
export const config = {
    api: {
        bodyParser: false,
    },
};

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

        // Get raw body for signature validation
        // In Vercel, req.body is already a Buffer when bodyParser is disabled
        const rawBody = req.body as Buffer | string;
        
        // Convert to Buffer if needed
        const bodyBuffer = Buffer.isBuffer(rawBody) 
            ? rawBody 
            : typeof rawBody === 'string' 
                ? Buffer.from(rawBody, 'utf8')
                : Buffer.from(JSON.stringify(rawBody), 'utf8');

        // Verify webhook signature
        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(
                bodyBuffer,
                sig,
                webhookSecret
            );
        } catch (err: any) {
            console.error('[Webhook] Signature verification failed:', err.message);
            return res.status(400).json({ 
                error: 'Invalid signature',
                message: err.message 
            });
        }

        console.log('[Webhook] 📩 Event received:', event.type);

        // ====================================================================
        // EVENT HANDLING
        // ====================================================================

        switch (event.type) {
            // ----------------------------------------------------------------
            // CHECKOUT SESSION COMPLETED
            // Handles both one-time payments and subscription checkouts
            // ----------------------------------------------------------------
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const metadata = session.metadata || {};
                
                // ✅ ADD DETAILED LOGGING
                console.log('='.repeat(60));
                console.log('[Webhook] 🎯 CHECKOUT SESSION COMPLETED EVENT RECEIVED');
                console.log('[Webhook] Timestamp:', new Date().toISOString());
                console.log('[Webhook] Session ID:', session.id);
                console.log('[Webhook] Mode:', session.mode);
                console.log('[Webhook] Payment Status:', session.payment_status);
                console.log('[Webhook] Customer ID:', session.customer);
                console.log('[Webhook] Subscription ID:', session.subscription);
                console.log('[Webhook] Metadata:', JSON.stringify(metadata, null, 2));
                console.log('='.repeat(60));

                const userId = metadata.user_id;
                const organizationId = metadata.organizationId;
                const planId = metadata.plan_id || metadata.planId ? parseInt(metadata.plan_id || metadata.planId) : null;
                const planName = metadata.plan_name || 'Payment';
                const credits = metadata.credits ? parseInt(metadata.credits) : null;
                const action = metadata.action; // 'upgrade', 'downgrade', or undefined for new subscriptions
                const purchaseType = metadata.type; // 'credit_purchase' for one-time credit buys

                // ========================================
                // CASE A: SUBSCRIPTION (new or upgrade/downgrade)
                // ========================================
                if (session.mode === 'subscription') {
                    console.log('[Webhook] 📦 MODE: SUBSCRIPTION - Processing subscription creation...');
                    console.log('[Webhook] Extracted values:');
                    console.log('[Webhook]   - Organization ID:', organizationId);
                    console.log('[Webhook]   - Plan ID:', planId);
                    console.log('[Webhook]   - User ID:', userId);
                    
                    // Validate metadata
                    if (!organizationId || !planId) {
                        console.error('[Webhook] ❌ CRITICAL: Missing required metadata');
                        console.error('[Webhook] organizationId:', organizationId, '(type:', typeof organizationId, ')');
                        console.error('[Webhook] planId:', planId, '(type:', typeof planId, ')');
                        console.error('[Webhook] Cannot proceed without metadata. Exiting.');
                        break;
                    }
                    
                    // Initialize Supabase
                    const supabase = createClient(
                        process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
                        process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
                    );

                    // 1. Upsert subscription record
                    const subscriptionId = session.subscription as string;
                    
                    console.log('[Webhook] Step 1: Creating/updating subscription record...');
                    const { error: subError } = await supabase
                        .from('organization_subscriptions')
                        .upsert({
                            organization_id: organizationId,
                            user_id: userId,
                            plan_id: planId,
                            status: 'active',
                            stripe_customer_id: session.customer as string,
                            stripe_subscription_id: subscriptionId,
                            started_at: new Date().toISOString(),
                            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
                            updated_at: new Date().toISOString()
                        });

                    if (subError) {
                        console.error('[Webhook] ❌ Error creating subscription:', subError);
                    } else {
                        console.log('[Webhook] ✅ Subscription record created/updated successfully');
                    }
                    
                    // ✅ AFTER SUBSCRIPTION IS CREATED, ADD THIS SECTION:
                    
                    console.log('[Webhook] ' + '='.repeat(50));
                    console.log('[Webhook] 💰 STARTING CREDITS CREATION PROCESS');
                    console.log('[Webhook] ' + '='.repeat(50));
                    
                    console.log('[Webhook] 💰 Step 1: Fetching plan data from database...');
                    console.log('[Webhook] Querying subscription_plans table for plan_id:', planId);
                    
                    const { data: planData, error: planError } = await supabase
                        .from('subscription_plans')
                        .select('id, name, credits, price')
                        .eq('id', planId)
                        .single();
                    
                    if (planError) {
                        console.error('[Webhook] ❌ Error fetching plan from database:', planError);
                        console.error('[Webhook] Error code:', planError.code);
                        console.error('[Webhook] Error message:', planError.message);
                        console.error('[Webhook] Error details:', JSON.stringify(planError, null, 2));
                    } else {
                        console.log('[Webhook] ✅ Plan fetched successfully:', planData);
                        console.log('[Webhook] Plan details:');
                        console.log('[Webhook]   - ID:', planData?.id);
                        console.log('[Webhook]   - Name:', planData?.name);
                        console.log('[Webhook]   - Credits:', planData?.credits);
                        console.log('[Webhook]   - Price:', planData?.price);
                    }
                    
                    const creditsToAdd = planData?.credits || 0;
                    
                    console.log('[Webhook] 💰 Step 2: Determining credits amount');
                    console.log('[Webhook] Credits to add:', creditsToAdd, '(type:', typeof creditsToAdd, ')');
                    
                    if (creditsToAdd === 0 || !creditsToAdd) {
                        console.error('[Webhook] ⚠️⚠️⚠️ WARNING: No credits to add!');
                        console.error('[Webhook] Reason: Plan has 0 credits or plan not found');
                        console.error('[Webhook] Plan data was:', planData);
                        console.error('[Webhook] SKIPPING credits creation');
                    } else {
                        console.log('[Webhook] ✅ Valid credits amount, proceeding...');
                        console.log('[Webhook] 💰 Step 3: Calling addCreditsToOrganization function');
                        console.log('[Webhook] Function parameters:');
                        console.log('[Webhook]   - organizationId:', organizationId);
                        console.log('[Webhook]   - creditsToAdd:', creditsToAdd);
                        console.log('[Webhook]   - source: "subscription"');
                        
                        try {
                            console.log('[Webhook] 🚀 Invoking addCreditsToOrganization...');
                            
                            const creditsResult = await addCreditsToOrganization(
                                organizationId, 
                                creditsToAdd, 
                                'subscription'
                            );
                            
                            console.log('[Webhook] ✅✅✅ SUCCESS: Credits created/updated successfully!');
                            console.log('[Webhook] Credits result:', JSON.stringify(creditsResult, null, 2));
                            console.log('[Webhook] New balance:', creditsResult?.balance);
                            
                        } catch (creditsError: any) {
                            console.error('[Webhook] ❌❌❌ CRITICAL ERROR: Failed to create/update credits');
                            console.error('[Webhook] Error type:', creditsError?.constructor?.name);
                            console.error('[Webhook] Error name:', creditsError?.name);
                            console.error('[Webhook] Error message:', creditsError?.message);
                            console.error('[Webhook] Error code:', creditsError?.code);
                            console.error('[Webhook] Error details:', creditsError?.details);
                            console.error('[Webhook] Error hint:', creditsError?.hint);
                            console.error('[Webhook] Full error object:', JSON.stringify(creditsError, null, 2));
                            console.error('[Webhook] Stack trace:', creditsError?.stack);
                            
                            // Don't throw - let the webhook complete even if credits fail
                            console.error('[Webhook] Continuing despite credits error (subscription was created)');
                        }
                    }
                    
                    console.log('[Webhook] 🏁 Subscription processing complete');
                    console.log('[Webhook] ' + '='.repeat(50));
                }

                // ========================================
                // CASE B: CREDIT PURCHASE (one-time payment)
                // ========================================
                else if (session.mode === 'payment' && purchaseType === 'credit_purchase') {
                    console.log('[Webhook] ════════════════════════════════════════════');
                    console.log('[Webhook] 💳 CREDIT PURCHASE DETECTED (One-time payment)');
                    console.log('[Webhook] ════════════════════════════════════════════');
                    
                    const creditPackId = metadata.creditPackId;
                    const packName = metadata.packName;

                    console.log('[Webhook] Credit Purchase Details:');
                    console.log('[Webhook]   - Organization ID:', organizationId);
                    console.log('[Webhook]   - Credits to add:', credits);
                    console.log('[Webhook]   - Pack ID:', creditPackId);
                    console.log('[Webhook]   - Pack Name:', packName);
                    console.log('[Webhook]   - Payment intent:', session.payment_intent);
                    console.log('[Webhook]   - Payment status:', session.payment_status);

                    if (!organizationId || !credits) {
                        console.error('[Webhook] ❌ Missing required metadata for credit purchase');
                        console.error('[Webhook] organizationId:', organizationId);
                        console.error('[Webhook] credits:', credits);
                        break;
                    }

                    if (credits <= 0) {
                        console.error('[Webhook] ❌ Invalid credits amount:', credits);
                        break;
                    }

                    console.log('[Webhook] 💰 Step 1: Fetching current balance...');

                    try {
                        // Initialize Supabase admin client
                        const supabaseAdmin = createClient(
                            process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
                            process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
                        );

                        // Get current credits record
                        const { data: currentCredits, error: fetchError } = await supabaseAdmin
                            .from('organization_credits')
                            .select('id, balance, total_purchased, total_consumed')
                            .eq('organization_id', organizationId)
                            .maybeSingle();

                        if (fetchError) {
                            console.error('[Webhook] ❌ Error fetching current credits:', fetchError);
                            throw fetchError;
                        }

                        console.log('[Webhook] Current credits record:', currentCredits);

                        // CASE A: No existing record (shouldn't happen, but handle it)
                        if (!currentCredits) {
                            console.log('[Webhook] ⚠️ No existing credits record, creating new one...');
                            
                            const { data: newRecord, error: insertError } = await supabaseAdmin
                                .from('organization_credits')
                                .insert({
                                    organization_id: organizationId,
                                    balance: credits,
                                    total_purchased: credits,
                                    total_consumed: 0,
                                    last_recharged_at: new Date().toISOString()
                                })
                                .select()
                                .single();

                            if (insertError) {
                                console.error('[Webhook] ❌ Error creating credits record:', insertError);
                                throw insertError;
                            }

                            console.log('[Webhook] ✅ New credits record created');
                            console.log('[Webhook] Balance:', newRecord.balance);
                            
                        } 
                        // CASE B: Existing record - ADD credits to current balance
                        else {
                            console.log('[Webhook] 💰 Step 2: Adding credits to existing balance...');
                            
                            const oldBalance = currentCredits.balance || 0;
                            const oldTotalPurchased = currentCredits.total_purchased || 0;
                            
                            const newBalance = oldBalance + credits;
                            const newTotalPurchased = oldTotalPurchased + credits;

                            console.log('[Webhook] Balance calculation:');
                            console.log('[Webhook]   - Old balance:', oldBalance);
                            console.log('[Webhook]   - Credits to add:', credits);
                            console.log('[Webhook]   - New balance:', newBalance);
                            console.log('[Webhook]   - Old total purchased:', oldTotalPurchased);
                            console.log('[Webhook]   - New total purchased:', newTotalPurchased);

                            const { data: updatedRecord, error: updateError } = await supabaseAdmin
                                .from('organization_credits')
                                .update({
                                    balance: newBalance,
                                    total_purchased: newTotalPurchased,
                                    last_recharged_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString()
                                })
                                .eq('organization_id', organizationId)
                                .select()
                                .single();

                            if (updateError) {
                                console.error('[Webhook] ❌ Error updating credits:', updateError);
                                console.error('[Webhook] Update error details:', JSON.stringify(updateError, null, 2));
                                throw updateError;
                            }

                            console.log('[Webhook] ✅✅✅ CREDITS PURCHASE SUCCESSFUL!');
                            console.log('[Webhook] Updated record:', updatedRecord);
                            console.log('[Webhook] New balance:', updatedRecord.balance);
                            console.log('[Webhook] Credits added:', credits);
                        }

                        console.log('[Webhook] 💰 Step 3: Credit purchase completed successfully');

                    } catch (error: any) {
                        console.error('[Webhook] ❌❌❌ FATAL ERROR processing credit purchase');
                        console.error('[Webhook] Error type:', error?.constructor?.name);
                        console.error('[Webhook] Error message:', error?.message);
                        console.error('[Webhook] Error details:', error);
                        console.error('[Webhook] Stack:', error?.stack);
                    }

                    console.log('[Webhook] ════════════════════════════════════════════');
                }

                // TODO: Send confirmation email to user/organization

                break;
            }

            // ----------------------------------------------------------------
            // PAYMENT INTENT SUCCEEDED
            // One-time payment successful
            // ----------------------------------------------------------------
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                console.log('[Webhook] ✅ Payment Intent succeeded:', paymentIntent.id);

                const metadata = paymentIntent.metadata || {};
                const userId = metadata.user_id;
                const credits = metadata.credits ? parseInt(metadata.credits) : null;
                const planId = metadata.plan_id ? parseInt(metadata.plan_id) : null;
                const planName = metadata.plan_name || 'One-time payment';

                console.log('[Webhook] Payment Intent details:', {
                    paymentIntentId: paymentIntent.id,
                    amount: paymentIntent.amount,
                    currency: paymentIntent.currency,
                    userId,
                    credits,
                    planId,
                    planName,
                });

                // If credits are specified in metadata, add tokens to user
                if (userId && credits) {
                    console.log('[Webhook] Adding tokens for one-time payment:', {
                        userId,
                        credits,
                        tokens: credits * 100, // Formula: tokens = credits × 100
                    });
                    
                    // TODO: Implement token addition logic here
                    // Example:
                    // await addTokensToUser(userId, credits, 'payment_one_time', planName, paymentIntent.id);
                } else {
                    console.log('[Webhook] ℹ️ Payment succeeded but no credits to assign (metadata missing)');
                }

                // TODO: Send confirmation email to user
                // TODO: Update order/payment status in database if needed

                break;
            }

            // ----------------------------------------------------------------
            // INVOICE PAYMENT SUCCEEDED
            // Subscription payment succeeded (renewal)
            // ----------------------------------------------------------------
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                console.log('[Webhook] ✅ Invoice payment succeeded:', invoice.id);
                
                await handlePaymentSucceeded(invoice);
                break;
            }

            // ----------------------------------------------------------------
            // INVOICE PAYMENT FAILED
            // Subscription payment failed
            // ----------------------------------------------------------------
            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice;
                console.log('[Webhook] ❌ Invoice payment failed:', invoice.id);
                
                await handlePaymentFailed(invoice);
                break;
            }

            // ----------------------------------------------------------------
            // SUBSCRIPTION UPDATED
            // Subscription status changed, plan changed, etc.
            // ----------------------------------------------------------------
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                console.log('[Webhook] 🔄 Subscription updated:', subscription.id);
                
                await handleSubscriptionUpdated(subscription);
                break;
            }

            // ----------------------------------------------------------------
            // SUBSCRIPTION DELETED
            // Subscription cancelled
            // ----------------------------------------------------------------
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                console.log('[Webhook] ❌ Subscription deleted:', subscription.id);
                
                await handleSubscriptionDeleted(subscription);
                break;
            }

            // ----------------------------------------------------------------
            // Other events (log but don't process)
            // ----------------------------------------------------------------
            default:
                console.log('[Webhook] ℹ️ Unhandled event type:', event.type);
        }

        // Always return 200 to acknowledge receipt
        return res.status(200).json({ 
            received: true,
            eventType: event.type 
        });
    } catch (error: any) {
        console.error('[Webhook] ❌ Error processing webhook:', error);
        console.error('[Webhook] Error stack:', error.stack);
        
        return res.status(500).json({ 
            error: 'Webhook processing failed',
            message: error.message 
        });
    }
}

// ============================================================================
// SUBSCRIPTION LIFECYCLE HANDLERS
// ============================================================================

/**
 * Handler for invoice.payment_succeeded event
 * Reactivates subscription and resets payment failure counter
 * 
 * MIGRATION NOTE: Now updates organization_subscriptions instead of user_subscriptions
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
    console.log('[Webhook] 📄 INVOICE PAYMENT SUCCEEDED');
    console.log('[Webhook] Invoice ID:', invoice.id);
    
    const customerId = invoice.customer as string;
    const subscriptionId = invoice.subscription as string;

    console.log('[Webhook] Customer ID:', customerId);
    console.log('[Webhook] Subscription ID:', subscriptionId);

    if (!subscriptionId) {
        console.log('[Webhook] No subscription ID, skipping');
        return;
    }

    console.log('[Webhook] 🔄 Processing monthly renewal...');

    // Initialize Supabase client with service role key for RLS bypass
    const supabase = createClient(
        process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Get organization subscription details
    console.log('[Webhook] Step 1: Fetching subscription from database...');
    const { data: orgSub, error: fetchError } = await supabase
        .from('organization_subscriptions')
        .select('organization_id, plan_id')
        .eq('stripe_subscription_id', subscriptionId)
        .single();

    if (fetchError || !orgSub) {
        console.error('[Webhook] ❌ Subscription not found for renewal');
        console.error('[Webhook] Error:', fetchError);
        console.error('[Webhook] Subscription ID searched:', subscriptionId);
        return;
    }

    console.log('[Webhook] Subscription found:', orgSub);
    console.log('[Webhook] Organization ID:', orgSub.organization_id);
    console.log('[Webhook] Plan ID:', orgSub.plan_id);

    // 2. Update subscription: reactivate account, reset failure counter
    console.log('[Webhook] Step 2: Updating subscription status...');
    const { error } = await supabase
        .from('organization_subscriptions') // MIGRATED: organization-based subscriptions
        .update({
            status: 'active',
            payment_failed_count: 0,
            last_payment_attempt: new Date().toISOString(),
            expires_at: new Date(invoice.period_end! * 1000).toISOString(),
        })
        .eq('stripe_customer_id', customerId);

    if (error) {
        console.error('[Webhook] Error updating subscription after payment success:', error);
        throw error;
    }

    console.log('[Webhook] ✅ Organization subscription reactivated for customer:', customerId);

    // 3. ✨ ADD CREDITS for monthly renewal
    console.log('[Webhook] Step 3: Processing renewal credits...');
    console.log('[Webhook] Fetching plan data for plan_id:', orgSub.plan_id);
    
    const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('credits, name')
        .eq('id', orgSub.plan_id)
        .single();

    if (planError) {
        console.error('[Webhook] ❌ Error fetching plan:', planError);
    } else {
        console.log('[Webhook] Plan fetched:', plan);
    }

    const creditsToAdd = plan?.credits || 0;

    console.log('[Webhook] Adding renewal credits:', creditsToAdd);
    console.log('[Webhook] Plan name:', plan?.name);

    if (creditsToAdd > 0) {
        try {
            await addCreditsToOrganization(orgSub.organization_id, creditsToAdd, 'renewal');
            console.log('[Webhook] ✅ Renewal credits added');
            console.log('[Webhook] Credits added:', {
                organizationId: orgSub.organization_id,
                creditsAdded: creditsToAdd,
                planName: plan?.name
            });
        } catch (error) {
            console.error('[Webhook] ❌ Error adding renewal credits:', error);
        }
    } else {
        console.warn('[Webhook] ⚠️ No credits to add (plan has 0 credits)');
    }

    // TODO: Send email notification to all organization members (payment successful, subscription renewed)
}

/**
 * Handler for invoice.payment_failed event
 * Increments failure counter and suspends account after 3 failures
 * 
 * MIGRATION NOTE: Now updates organization_subscriptions instead of user_subscriptions
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
    console.log('[Webhook] Processing payment failure for invoice:', invoice.id);

    const customerId = invoice.customer as string;

    // Initialize Supabase client
    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
    );

    // Retrieve current subscription
    const { data: subscription, error: fetchError } = await supabase
        .from('organization_subscriptions') // MIGRATED: organization-based subscriptions
        .select('payment_failed_count, organization_id')
        .eq('stripe_customer_id', customerId)
        .single();

    if (fetchError) {
        console.error('[Webhook] Error fetching subscription:', fetchError);
        throw fetchError;
    }

    const failedCount = (subscription?.payment_failed_count || 0) + 1;

    // After 3 failed attempts, suspend account; otherwise mark as past_due
    const newStatus = failedCount >= 3 ? 'suspended' : 'past_due';

    const { error } = await supabase
        .from('organization_subscriptions') // MIGRATED: organization-based subscriptions
        .update({
            status: newStatus,
            payment_failed_count: failedCount,
            last_payment_attempt: new Date().toISOString(),
        })
        .eq('stripe_customer_id', customerId);

    if (error) {
        console.error('[Webhook] Error updating subscription after payment failure:', error);
        throw error;
    }

    console.log(`[Webhook] ⚠️ Organization subscription status updated to ${newStatus} for customer:`, customerId);
    console.log(`[Webhook] Failed payment attempts: ${failedCount}/3`);

    // TODO: Send email notification to all organization members
    // - If failedCount < 3: "Payment failed, please update your payment method"
    // - If failedCount >= 3: "Account suspended due to payment failures, contact support"
}

/**
 * Handler for customer.subscription.updated event
 * Updates subscription details (plan change, status change, etc.)
 * 
 * MIGRATION NOTE: Now updates organization_subscriptions instead of user_subscriptions
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    console.log('[Webhook] Processing subscription update:', subscription.id);

    const customerId = subscription.customer as string;
    const metadata = subscription.metadata || {};

    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
    );

    // Get current subscription details BEFORE updating
    const { data: currentSub, error: fetchError } = await supabase
        .from('organization_subscriptions')
        .select('plan_id, organization_id')
        .eq('stripe_customer_id', customerId)
        .single();

    if (fetchError) {
        console.error('[Webhook] Error fetching current subscription:', fetchError);
        throw fetchError;
    }

    const currentPlanId = currentSub?.plan_id;
    const newPlanId = metadata.planId ? parseInt(metadata.planId) : null;
    const action = metadata.action; // 'upgrade' or 'downgrade' if from Checkout
    const organizationId = currentSub?.organization_id || metadata.organizationId;

    // Detect plan change
    const isPlanChange = newPlanId && currentPlanId && newPlanId !== currentPlanId;
    
    console.log('[Webhook] Subscription metadata:', {
        action,
        currentPlanId,
        newPlanId,
        isPlanChange,
        organizationId
    });

    // Build update object
    const updateData: any = {
        status: subscription.status,
        stripe_subscription_id: subscription.id,
        expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
    };

    // If this is a plan change, update the plan_id
    if (newPlanId) {
        updateData.plan_id = newPlanId;
        console.log('[Webhook] 🔄 Plan change detected:', {
            action,
            currentPlanId,
            newPlanId,
            status: subscription.status
        });
    }

    // Update subscription in database
    const { error } = await supabase
        .from('organization_subscriptions') // MIGRATED: organization-based subscriptions
        .update(updateData)
        .eq('stripe_customer_id', customerId);

    if (error) {
        console.error('[Webhook] Error updating subscription:', error);
        throw error;
    }

    console.log('[Webhook] ✅ Organization subscription updated for customer:', customerId);
    console.log('[Webhook] New status:', subscription.status);
    if (newPlanId) {
        console.log('[Webhook] Plan changed to ID:', newPlanId);
    }

    // Add credits for manual plan changes (not from Checkout)
    if (isPlanChange && organizationId && !action) {
        // This is a manual plan change from Stripe Dashboard (no 'action' metadata)
        // We need to add credits for the new plan
        
        console.log('[Webhook] 💎 Manual plan change detected - adding credits');

        // Get new plan credits
        const { data: newPlan } = await supabase
            .from('subscription_plans')
            .select('credits, name')
            .eq('id', newPlanId)
            .single();

        const creditsToAdd = newPlan?.credits || 0;

        if (creditsToAdd > 0) {
            await addCreditsToOrganization(organizationId, creditsToAdd, 'subscription');
            console.log('[Webhook] ✅ Manual plan change - credits added:', {
                organizationId,
                creditsAdded: creditsToAdd,
                planName: newPlan?.name,
                previousPlanId: currentPlanId,
                newPlanId
            });
        }
    } else if (isPlanChange && action) {
        console.log('[Webhook] ℹ️ Plan change from Checkout - credits already added by checkout.session.completed');
    }

    // TODO: Send email notification to organization members about plan change
    // - Include old plan name, new plan name, effective date
    // - Include pricing changes and new features unlocked
}

/**
 * Handler for customer.subscription.deleted event
 * Marks subscription as cancelled
 * 
 * MIGRATION NOTE: Now updates organization_subscriptions instead of user_subscriptions
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    console.log('[Webhook] Processing subscription deletion:', subscription.id);

    const customerId = subscription.customer as string;

    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
    );

    const { error } = await supabase
        .from('organization_subscriptions') // MIGRATED: organization-based subscriptions
        .update({
            status: 'cancelled',
            expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq('stripe_customer_id', customerId);

    if (error) {
        console.error('[Webhook] Error marking subscription as cancelled:', error);
        throw error;
    }

    console.log('[Webhook] ✅ Organization subscription cancelled for customer:', customerId);
    console.log('[Webhook] Access until:', new Date(subscription.current_period_end * 1000).toISOString());
}


