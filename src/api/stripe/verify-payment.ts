import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
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

    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { sessionId } = req.query;

        if (!sessionId || typeof sessionId !== 'string') {
            return res.status(400).json({ error: 'Session ID required' });
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(500).json({ error: 'Stripe not configured' });
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-12-15.clover' as any,
        });

        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['customer', 'subscription']
        });

        if (session.payment_status === 'paid') {
            return res.status(200).json({
                verified: true,
                status: session.status,
                customerEmail: session.customer_details?.email,
                metadata: session.metadata,
                customerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
                subscriptionId: typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
            });
        }

        return res.status(200).json({
            verified: false,
            paymentStatus: session.payment_status,
            message: 'Payment not completed'
        });

    } catch (error: any) {
        console.error('[API] Error verifying payment:', error);
        return res.status(500).json({
            error: 'Payment verification failed',
            message: error.message
        });
    }
}
