/**
 * Vercel Serverless Function
 * DELETE Account - Eliminazione definitiva di tutti i dati dell'utente
 * 
 * Questa funzione elimina definitivamente:
 * - organization_whatsapp_config
 * - organization_knowledge_base
 * - organization_hotels
 * - organization_pms_config
 * - organization_subscriptions
 * - organization_credits
 * - organization_members
 * - organizations
 * - profiles
 * - auth.users (via admin API)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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
    if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[DeleteAccount] Missing environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Initialize Supabase with service role key for admin operations
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    console.log('[DeleteAccount] Starting deletion for user:', userId);

    // Get user's organization_id
    const { data: userOrg, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId)
      .single();

    if (orgError && orgError.code !== 'PGRST116') {
      console.error('[DeleteAccount] Error fetching organization:', orgError);
      return res.status(500).json({ error: 'Failed to fetch organization' });
    }

    const userOrgId = userOrg?.organization_id;

    if (!userOrgId) {
      console.warn('[DeleteAccount] No organization found for user, proceeding with user deletion only');
    }

    // Delete in order (respecting foreign key constraints)
    if (userOrgId) {
      console.log('[DeleteAccount] Deleting organization data for org:', userOrgId);

      // 1. DELETE organization_whatsapp_config
      const { error: waError } = await supabase
        .from('organization_whatsapp_config')
        .delete()
        .eq('organization_id', userOrgId);
      if (waError) console.error('[DeleteAccount] Error deleting whatsapp_config:', waError);

      // 2. DELETE organization_knowledge_base
      const { error: kbError } = await supabase
        .from('organization_knowledge_base')
        .delete()
        .eq('organization_id', userOrgId);
      if (kbError) console.error('[DeleteAccount] Error deleting knowledge_base:', kbError);

      // 3. DELETE organization_hotels
      const { error: hotelsError } = await supabase
        .from('organization_hotels')
        .delete()
        .eq('organization_id', userOrgId);
      if (hotelsError) console.error('[DeleteAccount] Error deleting hotels:', hotelsError);

      // 4. DELETE organization_pms_config
      const { error: pmsError } = await supabase
        .from('organization_pms_config')
        .delete()
        .eq('organization_id', userOrgId);
      if (pmsError) console.error('[DeleteAccount] Error deleting pms_config:', pmsError);

      // 5. DELETE organization_subscriptions
      const { error: subError } = await supabase
        .from('organization_subscriptions')
        .delete()
        .eq('organization_id', userOrgId);
      if (subError) console.error('[DeleteAccount] Error deleting subscriptions:', subError);

      // 6. DELETE organization_credits
      const { error: creditsError } = await supabase
        .from('organization_credits')
        .delete()
        .eq('organization_id', userOrgId);
      if (creditsError) console.error('[DeleteAccount] Error deleting credits:', creditsError);

      // 7. DELETE organization_members (all members of this organization)
      const { error: membersError } = await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', userOrgId);
      if (membersError) console.error('[DeleteAccount] Error deleting members:', membersError);

      // 8. DELETE organizations
      const { error: orgDeleteError } = await supabase
        .from('organizations')
        .delete()
        .eq('id', userOrgId);
      if (orgDeleteError) console.error('[DeleteAccount] Error deleting organization:', orgDeleteError);
    }

    // 9. DELETE profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (profileError) {
      console.error('[DeleteAccount] Error deleting profile:', profileError);
      return res.status(500).json({ error: 'Failed to delete profile' });
    }

    // 10. DELETE auth.users (admin API)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) {
      console.error('[DeleteAccount] Error deleting auth user:', authError);
      return res.status(500).json({ error: 'Failed to delete auth user' });
    }

    console.log('[DeleteAccount] ✅ Account deleted successfully');

    return res.status(200).json({ 
      success: true, 
      message: 'Account eliminato definitivamente' 
    });

  } catch (error: any) {
    console.error('[DeleteAccount] Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Errore eliminazione account',
      message: error.message 
    });
  }
}
