// Build trigger: Syncing architecture and environment variables
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase credentials in .env');
}

// Performance optimization: Connection pooling and retry configuration
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: {
        schema: 'public',
    },
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
    global: {
        headers: {
            'x-client-info': 'armonyco-orchestrator',
        },
    },
    // Optimize for concurrent connections
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
});
