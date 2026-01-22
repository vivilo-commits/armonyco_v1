// Supabase Edge Function: create-team-member
// Creates a new user and adds them to an organization
// Uses Admin API to bypass rate limits and email confirmation

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateMemberRequest {
  email: string
  password: string
  full_name: string
  role: 'viewer' | 'manager' | 'admin'
  organization_id: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the request has authorization
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create Supabase client with service role (admin privileges)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create client with user's token to verify they're authenticated
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    )

    // Verify the calling user is authenticated
    const { data: { user: callingUser }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !callingUser) {
      throw new Error('Unauthorized: Invalid token')
    }

    // Parse request body
    const { email, password, full_name, role, organization_id }: CreateMemberRequest = await req.json()

    // Validate inputs
    if (!email || !password || !full_name || !organization_id) {
      throw new Error('Missing required fields: email, password, full_name, organization_id')
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }

    // Verify the calling user has permission to add members to this organization
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('user_id', callingUser.id)
      .eq('organization_id', organization_id)
      .single()

    if (membershipError || !membership) {
      throw new Error('You do not have access to this organization')
    }

    // Only owners and admins can add members
    if (!['owner', 'admin'].includes(membership.role)) {
      throw new Error('Only organization owners and admins can add team members')
    }

    // Check if email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const emailExists = existingUsers?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase())

    if (emailExists) {
      throw new Error('A user with this email already exists')
    }

    // Create the new user with Admin API (bypasses rate limits and email confirmation)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name
      }
    })

    if (createError) {
      console.error('Create user error:', createError)
      throw new Error(`Failed to create user: ${createError.message}`)
    }

    if (!newUser.user) {
      throw new Error('User creation returned no user')
    }

    // Create profile for the new user
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUser.user.id,
        email: email,
        full_name: full_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Don't fail completely - profile might be created by trigger
    }

    // Add user to organization
    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .insert({
        user_id: newUser.user.id,
        organization_id,
        role: role || 'viewer',
        created_at: new Date().toISOString()
      })

    if (memberError) {
      console.error('Member creation error:', memberError)
      // If membership fails, we should clean up the user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      throw new Error(`Failed to add user to organization: ${memberError.message}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Team member created successfully',
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          full_name
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unexpected error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
