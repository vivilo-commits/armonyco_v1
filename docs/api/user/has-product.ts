import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * API Endpoint: Check if user has active product
 * 
 * GET /api/user/has-product?userId=xxx&productId=yyy
 * 
 * Response:
 * {
 *   "hasFeature": boolean,
 *   "status": "active" | "paused" | "inactive" | "not_activated",
 *   "userId": string,
 *   "productId": string
 * }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ========== DEBUG LOGGING (REMOVE AFTER DEBUG) ==========
  console.log('[ENV CHECK] Environment variables status:', {
    hasUrl: !!process.env.VITE_SUPABASE_URL,
    hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    urlValue: process.env.VITE_SUPABASE_URL || 'MISSING',
    allSupabaseEnvKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
  });

  // Verify that the environment variables are present
  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[ENV CHECK] ❌ Missing environment variables!');
    return res.status(500).json({
      error: 'Server configuration error: Missing environment variables',
      debug: {
        hasUrl: !!process.env.VITE_SUPABASE_URL,
        hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        availableSupabaseKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE')),
        timestamp: new Date().toISOString()
      }
    });
  }

  console.log('[ENV CHECK] ✅ All environment variables present');
  // ========== END DEBUG LOGGING ==========

  // IMPORTANT: Supabase client creation HERE, AFTER the environment variables verification
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, productId } = req.query;

  if (!userId || !productId) {
    return res.status(400).json({ 
      error: 'Missing required parameters: userId and productId' 
    });
  }

  try {
    const { data, error } = await supabase
      .from('user_product_activations')
      .select('status')
      .eq('user_id', userId as string)
      .eq('product_id', productId as string)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('[API] Error checking user product:', error);
      throw error;
    }

    const hasFeature = data?.status === 'active';
    const status = data?.status || 'not_activated';

    return res.status(200).json({ 
      hasFeature,
      status,
      userId,
      productId,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('[API] Error in has-product endpoint:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
