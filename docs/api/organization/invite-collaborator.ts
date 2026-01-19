import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[Invite] Request received');
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[Invite] Missing environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { email, firstName, lastName, phone, organizationId } = req.body;

    console.log('[Invite] Data:', { email, firstName, lastName, organizationId });

    if (!email || !firstName || !lastName || !organizationId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile) {
      console.log('[Invite] User already exists:', existingProfile.id);
      
      // Check if already a member of the organization
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', existingProfile.id)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (existingMember) {
        return res.status(409).json({ 
          error: 'User is already a member of this organization',
          user: existingProfile
        });
      }

      // Add existing user to the organization
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          user_id: existingProfile.id,
          organization_id: organizationId,
          role: 'Collaborator',
        });

      if (memberError) {
        console.error('[Invite] Error adding existing user:', memberError);
        return res.status(500).json({ 
          error: 'Failed to add user to organization',
          details: memberError.message 
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Existing user added to organization',
        user: {
          id: existingProfile.id,
          email: existingProfile.email,
          firstName: existingProfile.first_name,
          lastName: existingProfile.last_name,
        },
      });
    }

    // Generate temporary password
    const tempPassword = 
      Math.random().toString(36).slice(-8) + 
      Math.random().toString(36).slice(-8) + 
      'Aa1!';
    
    console.log('[Invite] Creating new user...');

    // Create user - trigger will automatically create profile with role='AppUser'
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        firstName,         // For the trigger (snake_case fallback)
        lastName,
        first_name: firstName,  // Support both formats
        last_name: lastName,
        phone: phone || '',
        role: 'AppUser',   // ← IMPORTANT: tells trigger NOT to create organization
      },
    });

    if (authError) {
      console.error('[Invite] Auth error:', authError);
      return res.status(500).json({ 
        error: 'Failed to create user',
        details: authError.message 
      });
    }

    console.log('[Invite] User created:', authData.user.id);

    // Wait for trigger to finish
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Verify that profile was created by trigger
    const { data: newProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', authData.user.id)
      .single();

    if (profileCheckError || !newProfile) {
      console.error('[Invite] Profile not created by trigger:', profileCheckError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ 
        error: 'Failed to create user profile (trigger error)',
        details: profileCheckError?.message 
      });
    }

    console.log('[Invite] Profile created by trigger:', newProfile);

    // Add to organization_members
    console.log('[Invite] Adding to organization:', organizationId);
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        user_id: authData.user.id,
        organization_id: organizationId,
        role: 'Collaborator',
      });

    if (memberError) {
      console.error('[Invite] Member error:', memberError);
      // Rollback: delete user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ 
        error: 'Failed to add user to organization',
        details: memberError.message 
      });
    }

    console.log('[Invite] ✅ Collaborator invited successfully');

    return res.status(200).json({
      success: true,
      message: 'Collaborator invited successfully',
      user: {
        id: authData.user.id,
        email,
        firstName,
        lastName,
      },
      tempPassword,
    });

  } catch (error: any) {
    console.error('[Invite] Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
    });
  }
}
