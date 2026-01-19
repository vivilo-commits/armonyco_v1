import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { addCreditsToOrganization } from '../../src/backend/credits';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecret || !webhookSecret) {
        console.error('[Webhook] Missing Stripe configuration');
        return res.status(500).json({ error: 'Stripe not configured' });
    }

    const stripe = new Stripe(stripeSecret, {
        apiVersion: '2025-12-15.clover' as any,
    });

    const sig = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;

    try {
        // Read raw body
        const chunks = [];
        for await (const chunk of req) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        const body = Buffer.concat(chunks);

        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: any) {
        console.error(`[Webhook] Signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`[Webhook] Event: ${event.type}`);

    const supabase = createClient(
        process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!
    );

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const metadata = session.metadata || {};
                const organizationId = metadata.organizationId;
                const planId = metadata.planId;
                const credits = metadata.credits ? parseInt(metadata.credits) : 0;

                if (!organizationId) break;

                const { data: _updatedEntitlement, error: _updateError } = await supabase
                    .from('organization_entitlements')
                    .update({
                        stripe_customer_id: session.customer as string,
                        stripe_subscription_id: session.subscription as string,
                        subscription_active: true,
                        plan_tier: planId || metadata.plan_name,
                        updated_at: new Date().toISOString()
                    })
                    .eq('organization_id', organizationId);

                // Add Credits if it's a purchase or subscription start
                if (credits > 0) {
                    await addCreditsToOrganization(
                        organizationId,
                        credits,
                        session.mode === 'subscription' ? 'subscription' : 'purchase'
                    );
                }
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice;
                const customerId = invoice.customer as string;

                // Find organization by customer ID
                const { data: ent } = await supabase
                    .from('organization_entitlements')
                    .select('organization_id, plan_tier')
                    .eq('stripe_customer_id', customerId)
                    .single();

                if (ent) {
                    // Update subscription status
                    await supabase
                        .from('organization_entitlements')
                        .update({
                            subscription_active: true,
                            updated_at: new Date().toISOString()
                        })
                        .eq('organization_id', ent.organization_id);

                    // Add monthly credits if appropriate
                    // In a full production system, we'd lookup the plan credits here
                    const { data: plan } = await supabase
                        .from('subscription_plans')
                        .select('credits')
                        .eq('name', ent.plan_tier)
                        .single();

                    if (plan && plan.credits > 0) {
                        await addCreditsToOrganization(ent.organization_id, plan.credits, 'renewal');
                    }
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                await supabase
                    .from('organization_entitlements')
                    .update({
                        subscription_active: false,
                        updated_at: new Date().toISOString()
                    })
                    .eq('stripe_subscription_id', subscription.id);
                break;
            }
        }

        return res.status(200).json({ received: true });
    } catch (error: any) {
        console.error('[Webhook] Processing error:', error);
        return res.status(500).json({ error: 'Webhook processing failed' });
    }
}
