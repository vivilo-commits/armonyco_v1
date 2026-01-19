/**
 * Vercel Serverless Function
 * Verifies Stripe payment by session ID
 * 
 * This endpoint is called after the user returns from Stripe Checkout
 * to verify that the payment was actually completed before creating the account.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    const origin = req.headers.origin || '';
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'https://localhost:3000',
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
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ 
                error: 'Session ID required',
                message: 'sessionId must be provided in request body'
            });
        }

        // Verify Stripe is configured
        if (!process.env.STRIPE_SECRET_KEY) {
            console.error('[Verify Payment] ❌ STRIPE_SECRET_KEY not configured');
            return res.status(500).json({ 
                error: 'Stripe not configured',
                message: 'STRIPE_SECRET_KEY not found in environment variables.'
            });
        }

        // Initialize Stripe
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-02-24.acacia',
        });

        console.log('[Verify Payment] Retrieving session:', sessionId);

        // Retrieve the session from Stripe with expanded customer and subscription
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['customer', 'subscription']
        });

        console.log('[Verify Payment] Session retrieved:', {
            id: session.id,
            payment_status: session.payment_status,
            status: session.status,
            customer: typeof session.customer === 'string' ? session.customer : session.customer?.id,
            subscription: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
        });

        // Check if the payment was completed
        if (session.payment_status === 'paid') {
            // Extract customer ID (handle both string and expanded object)
            const stripeCustomerId = typeof session.customer === 'string' 
                ? session.customer 
                : session.customer?.id;
            
            // Extract subscription ID (handle both string and expanded object)
            const stripeSubscriptionId = typeof session.subscription === 'string'
                ? session.subscription
                : session.subscription?.id || null;

            return res.status(200).json({
                verified: true,
                sessionId: session.id,
                customerEmail: session.customer_details?.email,
                stripeCustomerId,
                stripeSubscriptionId,
                amountTotal: session.amount_total,
                currency: session.currency,
                paymentStatus: session.payment_status,
                metadata: session.metadata,
            });
        }

        // Payment not completed
        console.log('[Verify Payment] Payment not completed:', session.payment_status);
        return res.status(200).json({ 
            verified: false,
            paymentStatus: session.payment_status,
            message: 'Payment not completed'
        });
        
    } catch (error: any) {
        console.error('[Verify Payment] ❌ Error:', error);
        
        // Handle specific Stripe errors
        if (error.type === 'StripeInvalidRequestError') {
            return res.status(400).json({ 
                error: 'Invalid session ID',
                message: error.message || 'The session ID provided is invalid'
            });
        }
        
        if (error.type === 'StripeAuthenticationError') {
            return res.status(401).json({ 
                error: 'Stripe authentication error',
                message: 'STRIPE_SECRET_KEY is invalid'
            });
        }
        
        // Generic error
        return res.status(500).json({ 
            error: 'Payment verification failed',
            message: error.message || 'Unable to verify payment status'
        });
    }
}
