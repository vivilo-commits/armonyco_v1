import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Armo Credits Conversion System
 * 
 * CRITICAL RULE: NEVER expose tokens or euros to users
 * Always show Armo Credits in the UI
 * 
 * Conversion Rates:
 * - 1 Armo Credit = 1,000 OpenAI tokens
 * - 1 Armo Credit = €0.01
 */

export const CREDITS_CONFIG = {
    // Conversion rates (BACKEND ONLY - never expose to frontend)
    TOKENS_PER_CREDIT: 1000,
    EUROS_PER_CREDIT: 0.01,

    // Free tier
    FREE_CREDITS_ON_SIGNUP: 1000, // €10 worth

    // Pricing tiers (in Armo Credits)
    TIERS: {
        STARTER: {
            name: 'Starter',
            credits: 25000,
            price_euros: 249,
            price_cents: 24900,
        },
        PRO: {
            name: 'Pro',
            credits: 100000,
            price_euros: 499,
            price_cents: 49900,
        },
        ELITE: {
            name: 'Elite',
            credits: 250000,
            price_euros: 999,
            price_cents: 99900,
        },
        VIP: {
            name: 'VIP',
            credits: 0,
            price_euros: 0,
            price_cents: 0,
        },
    },
} as const;

/**
 * Convert AI tokens to Armo Credits
 */
export function tokensToCredits(tokens: number): number {
    return Math.ceil(tokens / CREDITS_CONFIG.TOKENS_PER_CREDIT);
}

/**
 * Convert euros to Armo Credits
 */
export function eurosToCredits(euros: number): number {
    return Math.round(euros / CREDITS_CONFIG.EUROS_PER_CREDIT);
}

/**
 * Convert Armo Credits to euros
 */
export function creditsToEuros(credits: number): number {
    return credits * CREDITS_CONFIG.EUROS_PER_CREDIT;
}

/**
 * Format credits for display
 */
export function formatCredits(credits: number): string {
    return `${credits.toLocaleString('en-US')} Credits`;
}

/**
 * Adds credits to an organization's balance and logs the transaction.
 * Standardized for use in Stripe webhooks and manual adjustments.
 */
export async function addCreditsToOrganization(
    organizationId: string,
    creditsToAdd: number,
    source: 'subscription' | 'purchase' | 'renewal' | 'adjustment',
    _metadata: any = {}
) {
    console.log(`[Credits] Adding ${creditsToAdd} credits to organization ${organizationId} (Source: ${source})`);

    try {
        // 1. Get current entitlements
        const { data: entitlement, error: fetchError } = await supabase
            .from('organization_entitlements')
            .select('credits_balance')
            .eq('organization_id', organizationId)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            throw fetchError;
        }

        const oldBalance = entitlement?.credits_balance || 0;
        const newBalance = oldBalance + creditsToAdd;

        // 2. Upsert entitlements balance
        const { data: _updatedEntitlement, error: updateError } = await supabase
            .from('organization_entitlements')
            .upsert({
                organization_id: organizationId,
                credits_balance: newBalance,
                updated_at: new Date().toISOString()
            }, { onConflict: 'organization_id' })
            .select()
            .single();

        if (updateError) throw updateError;

        // 3. Log transaction
        const { error: logError } = await supabase
            .from('credits_transactions')
            .insert({
                organization_id: organizationId,
                credits_before: oldBalance,
                credits_used: creditsToAdd, // In this table, credits_used is the delta
                credits_after: newBalance,
                transaction_type: source === 'purchase' || source === 'subscription' || source === 'renewal' ? 'purchase' : 'adjustment',
                // metadata would go into a JSONB column if it exists, but for now we follow the schema I saw
            });

        if (logError) {
            console.error('[Credits] Failed to log transaction:', logError);
            // Don't fail the whole operation if logging fails
        }

        return {
            success: true,
            balance: newBalance,
            previousBalance: oldBalance
        };

    } catch (error: any) {
        console.error('[Credits] Error in addCreditsToOrganization:', error);
        throw error;
    }
}
