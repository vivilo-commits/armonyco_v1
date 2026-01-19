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

        // If organizationId is missing but userId is present, try to fetch it or create it (Sign-up flow)
        if (!organizationId && userId) {
            console.log(`[API] 🔍 Missing organizationId for user ${userId}, attempting lookup...`);

            // First, try to find existing membership
            const { data: memberships, error: lookupError } = await supabaseAdmin
                .from('organization_members')
                .select('organization_id')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1);

            if (lookupError) {
                console.error(`[API] ❌ Lookup error for user ${userId}:`, lookupError);
            }

            if (memberships && memberships.length > 0) {
                organizationId = memberships[0].organization_id;
                console.log(`[API] ✅ Organization found: ${organizationId}`);
            } else {
                // No organization exists - create one automatically from user metadata
                console.log(`[API] 🏗️ No organization found, creating new one for user ${userId}...`);

                // Get user metadata (company_name, etc.) from auth.users
                const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);

                if (authError || !authUser?.user) {
                    console.error(`[API] ❌ Failed to get user metadata:`, authError);
                    return res.status(400).json({
                        error: 'User not found',
                        message: 'Could not retrieve user information for organization creation.'
                    });
                }

                const userMeta = authUser.user.user_metadata || {};
                const companyName = userMeta.company_name || `${userMeta.first_name || 'User'}'s Organization`;

                // Create organization
                const { data: newOrg, error: orgError } = await supabaseAdmin
                    .from('organizations')
                    .insert({
                        name: companyName,
                        owner_id: userId
                    })
                    .select('id')
                    .single();

                if (orgError || !newOrg) {
                    console.error(`[API] ❌ Failed to create organization:`, orgError);
                    return res.status(500).json({
                        error: 'Organization creation failed',
                        message: 'Could not create organization for new user.'
                    });
                }

                organizationId = newOrg.id;
                console.log(`[API] ✅ Organization created: ${organizationId} (${companyName})`);

                // Create organization membership
                const { error: memberError } = await supabaseAdmin
                    .from('organization_members')
                    .insert({
                        organization_id: organizationId,
                        user_id: userId,
                        role: 'owner'
                    });

                if (memberError) {
                    console.error(`[API] ⚠️ Failed to create membership:`, memberError);
                }

                // Create organization entitlements (inactive until payment completes)
                const { error: entError } = await supabaseAdmin
                    .from('organization_entitlements')
                    .insert({
                        organization_id: organizationId,
                        subscription_active: false,
                        credits_balance: 0,
                        plan_tier: planId || 'starter'
                    });

                if (entError) {
                    console.error(`[API] ⚠️ Failed to create entitlements:`, entError);
                }

                // Create user profile
                const fullName = [userMeta.first_name, userMeta.last_name].filter(Boolean).join(' ') || email;
                const { error: profileError } = await supabaseAdmin
                    .from('profiles')
                    .upsert({
                        id: userId,
                        email: authUser.user.email || email,
                        full_name: fullName,
                        phone: userMeta.phone || null,
                        language: 'en',
                        ai_tone: 'professional'
                    }, { onConflict: 'id' });

                if (profileError) {
                    console.error(`[API] ⚠️ Failed to create profile:`, profileError);
                }

                console.log(`[API] ✅ Organization setup complete for ${companyName}`);
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
