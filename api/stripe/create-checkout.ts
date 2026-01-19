import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // ... CORS headers (unchanged)
    const origin = req.headers.origin || '';
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://app.armonyco.com',
    ];

    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        let {
            planId,
            planName,
            priceId,
            amount,
            credits,
            email,
            organizationId,
            userId,
            metadata,
            successUrl,
            cancelUrl,
            mode = 'subscription'
        } = req.body;

        // Determine request origin and success/cancel URLs early
        const requestOrigin = req.headers.origin || `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
        const finalSuccessUrl = successUrl || `${requestOrigin}/app/settings?tab=subscription&payment=success&session_id={CHECKOUT_SESSION_ID}`;
        const finalCancelUrl = cancelUrl || `${requestOrigin}/app/settings?tab=subscription&payment=canceled`;

        // If organizationId is missing but userId is present, try to fetch it (Sign-up flow)
        if (!organizationId && userId) {
            console.log(`[API] 🔍 Missing organizationId for user ${userId}, attempting lookup...`);

            // Retry logic (3 attempts)
            for (let i = 0; i < 5; i++) {
                const { data: membership } = await supabaseAdmin
                    .from('organization_members')
                    .select('organization_id')
                    .eq('user_id', userId)
                    .single();

                if (membership) {
                    organizationId = membership.organization_id;
                    console.log(`[API] ✅ Organization found: ${organizationId}`);
                    break;
                }

                if (i < 4) {
                    console.log(`[API] ⏳ Org bit busy... retry ${i + 1}/5`);
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }

        if (!email || !organizationId) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Email and Organization ID (or User ID for lookup) are required.'
            });
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(500).json({
                error: 'Stripe not configured',
                message: 'STRIPE_SECRET_KEY not found in environment variables.'
            });
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-12-15.clover' as any,
        });

        // 1. Create or retrieve customer
        const existingCustomers = await stripe.customers.list({ email, limit: 1 });
        let customer;
        if (existingCustomers.data.length > 0) {
            customer = existingCustomers.data[0];
        } else {
            customer = await stripe.customers.create({
                email,
                metadata: { organization_id: organizationId, user_id: userId || '' }
            });
        }

        // 3. Configure Session
        let sessionConfig: Stripe.Checkout.SessionCreateParams;

        if (mode === 'payment') {
            sessionConfig = {
                customer: customer.id,
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: planName || 'Credits Top-up',
                            description: credits ? `${credits} Credits` : undefined,
                        },
                        unit_amount: amount,
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: finalSuccessUrl,
                cancel_url: finalCancelUrl,
                metadata: {
                    organizationId,
                    userId: userId || '',
                    credits: credits?.toString() || '0',
                    type: 'credit_purchase',
                    ...metadata
                }
            };
        } else {
            // Subscription mode needs a Price ID
            const stripePriceId = priceId || process.env[`STRIPE_PRICE_${planId?.toUpperCase()}`];

            if (!stripePriceId) {
                return res.status(400).json({ error: 'Stripe Price ID not found for plan' });
            }

            sessionConfig = {
                customer: customer.id,
                payment_method_types: ['card'],
                line_items: [{ price: stripePriceId, quantity: 1 }],
                mode: 'subscription',
                success_url: finalSuccessUrl,
                cancel_url: finalCancelUrl,
                subscription_data: {
                    metadata: {
                        organizationId,
                        planId: planId?.toString() || '',
                        credits: credits?.toString() || '0',
                        userId: userId || ''
                    }
                },
                metadata: {
                    organizationId,
                    planId: planId?.toString() || '',
                    ...metadata
                },
                allow_promotion_codes: true,
            };
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

        return res.status(200).json({
            sessionId: session.id,
            url: session.url,
        });

    } catch (error: any) {
        console.error('[API] Error creating checkout session:', error);
        return res.status(500).json({
            error: 'Failed to create checkout session',
            message: error.message
        });
    }
}
