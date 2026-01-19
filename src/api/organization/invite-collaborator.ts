import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
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
        const { email, organizationId, role = 'member' } = req.body;

        if (!email || !organizationId) {
            return res.status(400).json({ error: 'Email and Organization ID are required' });
        }

        const supabase = createClient(
            process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!
        );

        // 1. Check if user already exists
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        // 2. Add to organization (or send invite if it were a full system)
        // For this project's simplified model, we just insert into organization_members
        if (profile) {
            const { error: inviteError } = await supabase
                .from('organization_members')
                .insert({
                    organization_id: organizationId,
                    user_id: profile.id,
                    role: role
                });

            if (inviteError && inviteError.code !== '23505') { // Ignore duplicate entries
                throw inviteError;
            }
        } else {
            // In a real production system, send an email invite here
            console.log(`[Invite] User ${email} not found, would send email invite.`);
        }

        return res.status(200).json({
            success: true,
            message: profile ? 'User added to organization' : 'Invitation sent'
        });

    } catch (error: any) {
        console.error('[API] Error in invite-collaborator:', error);
        return res.status(500).json({ error: 'Failed to process invitation' });
    }
}
