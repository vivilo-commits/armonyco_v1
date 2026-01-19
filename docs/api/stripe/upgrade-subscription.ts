/**
 * Vercel Serverless Function
 * Handles subscription upgrade/downgrade via Stripe Checkout
 * 
 * This endpoint creates a new Stripe Checkout session to allow users to
 * upgrade or downgrade their subscription plan.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getStripePriceId, hasPriceIdConfigured } from '../../src/config/stripePrices';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { 
            organizationId, 
            newPlanId, 
            currentSubscriptionId 
        } = req.body;

        // Validate required fields
        if (!organizationId || !newPlanId) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                details: 'organizationId and newPlanId are required' 
            });
        }

        // Check if Stripe is configured
        if (!process.env.STRIPE_SECRET_KEY) {
            console.log('[Upgrade] Stripe not configured, returning mock response');
            return res.status(200).json({
                checkoutUrl: `/settings?tab=billing&upgrade=mock`,
                sessionId: 'mock_session_id',
                message: 'MOCK: Stripe not configured'
            });
        }

        // Initialize Stripe
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-02-24.acacia',
        });

        // Initialize Supabase with service role key
        const supabase = createClient(
            process.env.VITE_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Fetch the new plan details from database
        const { data: newPlan, error: planError } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('id', newPlanId)
            .single();

        if (planError || !newPlan) {
            console.error('[Upgrade] Plan not found:', planError);
            return res.status(404).json({ 
                error: 'Plan not found',
                details: planError?.message 
            });
        }

        // 2. Fetch organization details
        const { data: organization, error: orgError } = await supabase
            .from('organizations')
            .select('billing_email, name')
            .eq('id', organizationId)
            .single();

        if (orgError || !organization) {
            console.error('[Upgrade] Organization not found:', orgError);
            return res.status(404).json({ 
                error: 'Organization not found',
                details: orgError?.message 
            });
        }

        // 3. Check if organization has an existing Stripe customer ID
        const { data: currentSub, error: subError } = await supabase
            .from('organization_subscriptions')
            .select('stripe_customer_id, stripe_subscription_id, plan_id')
            .eq('organization_id', organizationId)
            .eq('status', 'active')
            .single();

        if (subError && subError.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('[Upgrade] Error fetching current subscription:', subError);
            return res.status(500).json({ 
                error: 'Error fetching subscription',
                details: subError.message 
            });
        }

        console.log('[Upgrade] Current subscription:', currentSub);
        console.log('[Upgrade] New plan:', newPlan.name, newPlan.price);

        // Get Stripe Price ID from mapping
        const stripePriceId = getStripePriceId(newPlanId);
        
        if (!stripePriceId) {
            console.error('[Upgrade] No Stripe Price ID configured for plan:', newPlanId);
            return res.status(400).json({
                error: 'Plan configuration error',
                details: `No Stripe Price ID configured for plan ${newPlan.name} (ID: ${newPlanId})`
            });
        }

        console.log('[Upgrade] Using Stripe Price ID:', stripePriceId);

        // 4. Determine upgrade or downgrade
        const isUpgrade = currentSub && newPlanId > currentSub.plan_id;
        const action = isUpgrade ? 'upgrade' : 'downgrade';

        console.log('[Upgrade] Action:', action);
        console.log('[Upgrade] Existing customer ID:', currentSub?.stripe_customer_id);

        // 5. Create Stripe Checkout Session
        const sessionConfig: Stripe.Checkout.SessionCreateParams = {
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{
                price: stripePriceId,
                quantity: 1,
            }],
            customer_email: currentSub?.stripe_customer_id ? undefined : organization.billing_email,
            customer: currentSub?.stripe_customer_id || undefined,
            success_url: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/app/settings?tab=billing&upgrade=success&plan=${newPlan.name}`,
            cancel_url: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/app/settings?tab=billing&upgrade=canceled`,
            metadata: {
                organizationId,
                planId: newPlanId.toString(),
                action,
                previousSubscriptionId: currentSubscriptionId || currentSub?.stripe_subscription_id || '',
                previousPlanId: currentSub?.plan_id?.toString() || ''
            },
            subscription_data: {
                metadata: {
                    organizationId,
                    planId: newPlanId.toString(),
                    action
                }
            },
            allow_promotion_codes: true,
        };

        // If customer already has a subscription, we need to handle the upgrade/downgrade
        // Stripe Checkout will automatically prorate when switching subscriptions
        if (currentSub?.stripe_subscription_id) {
            // Cancel the old subscription when the new one is created
            sessionConfig.subscription_data = {
                ...sessionConfig.subscription_data,
                metadata: {
                    ...sessionConfig.subscription_data?.metadata,
                    replace_subscription: currentSub.stripe_subscription_id
                }
            };
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

        console.log('[Upgrade] Checkout session created:', session.id);
        console.log('[Upgrade] Checkout URL:', session.url);

        return res.status(200).json({
            checkoutUrl: session.url,
            sessionId: session.id,
            message: `${action} initiated successfully`
        });

    } catch (error: any) {
        console.error('[Upgrade] Error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
