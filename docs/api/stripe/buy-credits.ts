/**
 * Vercel Serverless Function
 * Handles one-time credit purchase via Stripe Checkout
 * 
 * This endpoint creates a Stripe Checkout session for buying credit packs.
 * After successful payment, the webhook will add credits to organization_credits.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getCreditPackById, getTotalCredits } from '../../src/config/creditPacks';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { organizationId, creditPackId } = req.body;

    console.log('[BuyCredits] Request:', { organizationId, creditPackId });

    // Validate required fields
    if (!organizationId || !creditPackId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'organizationId and creditPackId are required' 
      });
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.log('[BuyCredits] Stripe not configured, returning mock response');
      return res.status(200).json({
        checkoutUrl: `/settings?tab=subscription&credits=mock`,
        sessionId: 'mock_session_id',
        message: 'MOCK: Stripe not configured'
      });
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
    });

    // Initialize Supabase
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Get pack details from config
    const pack = getCreditPackById(creditPackId);
    
    if (!pack) {
      console.error('[BuyCredits] Credit pack not found:', creditPackId);
      return res.status(404).json({ error: 'Credit pack not found' });
    }

    const totalCredits = getTotalCredits(pack); // Include bonus

    console.log('[BuyCredits] Pack details:', {
      packName: pack.name,
      baseCredits: pack.credits,
      bonus: pack.bonus || 0,
      totalCredits,
      price: pack.price
    });

    // 2. Get organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('billing_email, name')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      console.error('[BuyCredits] Organization not found:', orgError);
      return res.status(404).json({ 
        error: 'Organization not found',
        details: orgError?.message 
      });
    }

    // 3. Check if organization has existing Stripe customer ID
    const { data: existingSub } = await supabase
      .from('organization_subscriptions')
      .select('stripe_customer_id')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single();

    console.log('[BuyCredits] Existing customer ID:', existingSub?.stripe_customer_id || 'none');

    // 4. Create Stripe Checkout Session (ONE-TIME payment)
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment', // One-time payment (not subscription)
      payment_method_types: ['card'],
      line_items: [{
        price: pack.stripePriceId,
        quantity: 1,
      }],
      customer_email: existingSub?.stripe_customer_id ? undefined : organization.billing_email,
      customer: existingSub?.stripe_customer_id || undefined,
      success_url: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/app/settings?tab=subscription&credits=success&amount=${totalCredits}`,
      cancel_url: `${process.env.VITE_APP_URL || 'http://localhost:5173'}/app/settings?tab=subscription&credits=canceled`,
      metadata: {
        organizationId,
        credits: totalCredits.toString(), // Total credits including bonus
        creditPackId: creditPackId.toString(),
        packName: pack.name,
        type: 'credit_purchase' // Important: identifies this as credit purchase
      },
      allow_promotion_codes: true,
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('[BuyCredits] ✅ Checkout session created:', session.id);
    console.log('[BuyCredits] Checkout URL:', session.url);

    return res.status(200).json({
      checkoutUrl: session.url,
      sessionId: session.id,
      message: 'Credit purchase initiated successfully'
    });

  } catch (error: any) {
    console.error('[BuyCredits] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
