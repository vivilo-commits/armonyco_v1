import { supabase } from '@/database/supabase';

export interface StripeSessionResponse {
    url: string;
}

export const STRIPE_CONFIG = {
    TIERS: {
        PRO: {
            id: 'prod_TouQuDBJCCCuBb',
            priceId: 'price_1SrGcDEwc5UbVBFjDnejgprL',
            name: 'Armonyco Pro',
            credits: 25000,
        },
        SCALE: {
            id: 'prod_TouQwxK1BCwG16',
            priceId: 'price_1SrGcEEwc5UbVBFjMKzJV4pz',
            name: 'Armonyco Scale',
            credits: 100000,
        },
        ENTERPRISE: {
            id: 'prod_TouQJBPUqphhD9',
            priceId: 'price_1SrGcEEwc5UbVBFjSqhLsjhS',
            name: 'Armonyco Enterprise',
            credits: 250000,
        },
        TOP_UP: {
            id: 'prod_TouQMLbk8LUkuQ',
            priceId: 'price_1SrGcFEwc5UbVBFjfeunIca9',
            name: 'ArmoCredits Top-up',
            credits: 10000,
        }
    }
} as const;

export class StripeApiService {
    /**
     * Create a Checkout Session for a subscription tier
     * @param priceId - The Stripe Price ID
     * @param organizationId - The tenant's organization ID
     */
    async createCheckoutSession(priceId: string, organizationId: string): Promise<StripeSessionResponse> {
        // In a real production app, this would call your Node/Edge function backend
        // Since we are using MCP/Supabase, we would typically trigger this via a Supabase Edge Function

        try {
            // Mocking the redirect for now as we don't have the Edge Function deployed yet
            // In a real scenario, we'd use:
            // const { data, error } = await supabase.functions.invoke('create-stripe-session', {
            //   body: { priceId, organizationId }
            // });

            console.log(`[Stripe] Creating session for Price: ${priceId}, Org: ${organizationId}`);

            // For demonstration in sandbox, we return a fallback or instructions
            // Ideally, the user provides a real endpoint.
            return { url: `https://billing.armonyco.ai/checkout?price=${priceId}&org=${organizationId}` };
        } catch (error) {
            console.error('[Stripe] Failed to create checkout session:', error);
            throw error;
        }
    }

    /**
     * Sync a subscription from Stripe (usually triggered by webhook)
     * This is provided for documentation/internal use logic
     */
    async syncSubscription(subscriptionId: string) {
        const { data, error } = await supabase
            .from('stripe_webhook_events')
            .insert({
                event_type: 'subscription.updated',
                payload: { subscription_id: subscriptionId },
                status: 'pending'
            });

        if (error) throw error;
        return data;
    }
}

export const stripeApi = new StripeApiService();
