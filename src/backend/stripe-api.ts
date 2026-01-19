import { supabase } from '@/database/supabase';

export interface StripeSessionResponse {
    url: string;
}

export const STRIPE_CONFIG = {
    TIERS: {
        STARTER: {
            id: 'prod_TouQuDBJCCCuBb',
            priceId: 'price_1SrGcDEwc5UbVBFjDnejgprL',
            name: 'Armonyco Starter',
            credits: 25000,
        },
        PRO: {
            id: 'prod_TouQwxK1BCwG16',
            priceId: 'price_1SrGcEEwc5UbVBFjMKzJV4pz',
            name: 'Armonyco Pro',
            credits: 100000,
        },
        ELITE: {
            id: 'prod_TouQJBPUqphhD9',
            priceId: 'price_1SrGcEEwc5UbVBFjSqhLsjhS',
            name: 'Armonyco Elite',
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
    async createCheckoutSession(params: {
        priceId?: string;
        amount?: number;
        planId?: string;
        planName?: string;
        credits?: number;
        email: string;
        organizationId?: string;
        userId?: string;
        mode?: 'payment' | 'subscription';
        metadata?: Record<string, any>;
    }): Promise<StripeSessionResponse> {
        try {
            console.log(`[Stripe] 🔄 Creating session...`, params);

            const response = await fetch('/api/stripe/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });

            const text = await response.text();

            if (!response.ok) {
                try {
                    const errorJson = JSON.parse(text);
                    throw new Error(errorJson.message || errorJson.error || 'Failed to create checkout session');
                } catch (e) {
                    throw new Error(`API Error (${response.status}): ${text.slice(0, 150)}`);
                }
            }

            try {
                return JSON.parse(text);
            } catch (e) {
                console.error('[Stripe] JSON Parse Error. Raw response:', text);
                throw new Error('Invalid response from payment server. Please check local API status.');
            }
        } catch (error) {
            console.error('[Stripe] Checkout error:', error);
            throw error;
        }
    }

    /**
     * Verify a payment session
     */
    async verifyPayment(sessionId: string): Promise<{ verified: boolean; customerId?: string; subscriptionId?: string }> {
        try {
            const response = await fetch(`/api/stripe/verify-payment?sessionId=${sessionId}`);
            if (!response.ok) throw new Error('Failed to verify payment');
            return await response.json();
        } catch (error) {
            console.error('[Stripe] Verification error:', error);
            return { verified: false };
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
