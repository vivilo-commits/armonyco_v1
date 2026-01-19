/**
 * Vercel Serverless Function
 * Creates a Stripe Payment Intent for one-time payments
 * 
 * This endpoint initializes a payment using Stripe Payment Intent API
 * which allows for embedded payment forms with PaymentElement
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { 
            amount,        // Amount in cents (e.g. 30428 for €304.28)
            currency = 'eur',
            email,
            userId,
            metadata = {},
            description,
        } = req.body;

        // Input validation
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Missing or invalid amount' });
        }

        if (!email) {
            return res.status(400).json({ error: 'Missing required field: email' });
        }

        // Verify Stripe is configured
        if (!process.env.STRIPE_SECRET_KEY) {
            console.error('[API] ❌ STRIPE_SECRET_KEY not configured');
            return res.status(500).json({ 
                error: 'Stripe not configured',
                message: 'STRIPE_SECRET_KEY not found in environment variables. Configure Stripe in Vercel Dashboard → Settings → Environment Variables.',
                hint: 'See CONFIGURAZIONE_VERCEL.md for instructions'
            });
        }
        
        console.log('[API] ✅ Stripe configured, creating payment intent...');

        let stripe: Stripe;
        try {
            stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
                apiVersion: '2025-02-24.acacia',
            });
            console.log('[API] ✅ Stripe client initialized');
        } catch (stripeError: any) {
            console.error('[API] ❌ Stripe initialization error:', stripeError);
            return res.status(500).json({ 
                error: 'Stripe initialization error',
                message: stripeError.message || 'Unable to initialize Stripe. Verify STRIPE_SECRET_KEY.'
            });
        }

        // ================================================================
        // STEP 1: Create or retrieve Stripe Customer
        // ================================================================
        
        let customer;
        try {
            // Check if customer already exists with this email
            const existingCustomers = await stripe.customers.list({
                email: email,
                limit: 1,
            });

            if (existingCustomers.data.length > 0) {
                customer = existingCustomers.data[0];
                console.log('[Stripe] Existing customer found:', customer.id);
            } else {
                // Create new customer
                customer = await stripe.customers.create({
                    email: email,
                    metadata: {
                        user_id: userId || '',
                        ...metadata,
                    },
                });
                console.log('[Stripe] New customer created:', customer.id);
            }
        } catch (customerError: any) {
            console.error('[Stripe] Error managing customer:', customerError);
            return res.status(500).json({ 
                error: 'Customer creation error',
                message: customerError.message || 'Unable to create or retrieve customer'
            });
        }

        // ================================================================
        // STEP 2: Create Payment Intent
        // ================================================================

        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount), // Ensure integer
                currency: currency.toLowerCase(),
                customer: customer.id,
                automatic_payment_methods: {
                    enabled: true, // Enable all payment methods (cards, wallets, etc.)
                },
                description: description || `Payment for ${email}`,
                metadata: {
                    user_id: userId || '',
                    email: email,
                    ...metadata,
                },
                // Enable receipt emails
                receipt_email: email,
            });

            console.log('[Stripe] Payment Intent created:', paymentIntent.id);

            // Return client secret for frontend
            return res.status(200).json({
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                customerId: customer.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                status: paymentIntent.status,
            });
        } catch (paymentError: any) {
            console.error('[Stripe] Error creating payment intent:', paymentError);
            
            // Handle specific Stripe errors
            if (paymentError.type === 'StripeInvalidRequestError') {
                return res.status(400).json({ 
                    error: 'Stripe request error',
                    message: paymentError.message || 'Invalid request to Stripe',
                    details: paymentError.raw?.message
                });
            }
            
            if (paymentError.type === 'StripeAuthenticationError') {
                return res.status(401).json({ 
                    error: 'Stripe authentication error',
                    message: 'STRIPE_SECRET_KEY is invalid. Verify the key in Vercel.'
                });
            }
            
            if (paymentError.type === 'StripeAPIError') {
                return res.status(502).json({ 
                    error: 'Stripe API error',
                    message: paymentError.message || 'Error communicating with Stripe'
                });
            }
            
            return res.status(500).json({ 
                error: 'Failed to create payment intent',
                message: paymentError.message || 'Unknown error while creating payment intent',
                type: paymentError.type || 'UnknownError',
            });
        }
    } catch (error: any) {
        console.error('[API] ❌ Unexpected error:', error);
        console.error('[API] Error type:', error.type);
        console.error('[API] Error message:', error.message);
        console.error('[API] Error stack:', error.stack);
        
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message || 'Unknown error occurred',
            hint: 'Check logs in Vercel Dashboard → Functions for more details'
        });
    }
}


