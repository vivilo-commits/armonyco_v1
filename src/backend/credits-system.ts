import { supabase } from '@/database/supabase';

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
            credits: 10000,
            price_euros: 100,
            price_cents: 10000,
        },
        PROFESSIONAL: {
            name: 'Professional',
            credits: 50000,
            price_euros: 400,
            price_cents: 40000,
        },
        ENTERPRISE: {
            name: 'Enterprise',
            credits: 200000,
            price_euros: 1500,
            price_cents: 150000,
        },
    },
} as const;

/**
 * Convert AI (OpenRouter) tokens to Armo Credits
 * NEVER expose this function to frontend
 * 
 * @param tokens - Number of OpenAI tokens used
 * @returns Number of Armo Credits to deduct
 */
export function tokensToCredits(tokens: number): number {
    return Math.ceil(tokens / CREDITS_CONFIG.TOKENS_PER_CREDIT);
}

/**
 * Convert euros to Armo Credits
 * NEVER expose this function to frontend
 * 
 * @param euros - Amount in euros
 * @returns Number of Armo Credits
 */
export function eurosToCredits(euros: number): number {
    return Math.round(euros / CREDITS_CONFIG.EUROS_PER_CREDIT);
}

/**
 * Convert Armo Credits to euros (for internal calculations only)
 * NEVER expose this function to frontend
 * 
 * @param credits - Number of Armo Credits
 * @returns Amount in euros
 */
export function creditsToEuros(credits: number): number {
    return credits * CREDITS_CONFIG.EUROS_PER_CREDIT;
}

/**
 * Deduct credits from user balance
 * This is called after each execution
 * 
 * @param userId - User ID
 * @param creditsUsed - Number of credits to deduct
 * @returns Success status and new balance
 */
export async function deductCredits(
    userId: string,
    creditsUsed: number
): Promise<{ success: boolean; newBalance: number; error?: string }> {
    try {
        // Get current balance
        const { data: subscription, error: fetchError } = await supabase
            .from('user_subscriptions')
            .select('credits_balance')
            .eq('user_id', userId)
            .single();

        if (fetchError || !subscription) {
            return {
                success: false,
                newBalance: 0,
                error: 'Subscription not found',
            };
        }

        const currentBalance = subscription.credits_balance || 0;
        const newBalance = currentBalance - creditsUsed;

        // Don't allow negative balance
        if (newBalance < 0) {
            return {
                success: false,
                newBalance: currentBalance,
                error: 'Insufficient credits',
            };
        }

        // Update balance
        const { error: updateError } = await supabase
            .from('user_subscriptions')
            .update({ credits_balance: newBalance })
            .eq('user_id', userId);

        if (updateError) {
            return {
                success: false,
                newBalance: currentBalance,
                error: updateError.message,
            };
        }

        return {
            success: true,
            newBalance,
        };
    } catch (error) {
        console.error('[Credits] Deduction failed:', error);
        return {
            success: false,
            newBalance: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Add credits to user balance (after purchase)
 * 
 * @param userId - User ID
 * @param creditsToAdd - Number of credits to add
 * @returns Success status and new balance
 */
export async function addCredits(
    userId: string,
    creditsToAdd: number
): Promise<{ success: boolean; newBalance: number; error?: string }> {
    try {
        // Get current balance
        const { data: subscription, error: fetchError } = await supabase
            .from('user_subscriptions')
            .select('credits_balance')
            .eq('user_id', userId)
            .single();

        if (fetchError || !subscription) {
            return {
                success: false,
                newBalance: 0,
                error: 'Subscription not found',
            };
        }

        const currentBalance = subscription.credits_balance || 0;
        const newBalance = currentBalance + creditsToAdd;

        // Update balance
        const { error: updateError } = await supabase
            .from('user_subscriptions')
            .update({ credits_balance: newBalance })
            .eq('user_id', userId);

        if (updateError) {
            return {
                success: false,
                newBalance: currentBalance,
                error: updateError.message,
            };
        }

        return {
            success: true,
            newBalance,
        };
    } catch (error) {
        console.error('[Credits] Addition failed:', error);
        return {
            success: false,
            newBalance: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Get user's current credits balance
 * This is the ONLY function that should be exposed to frontend
 * 
 * @param userId - User ID
 * @returns Current credits balance
 */
export async function getUserCredits(userId: string): Promise<number> {
    const { data } = await supabase
        .from('user_subscriptions')
        .select('credits_balance')
        .eq('user_id', userId)
        .single();

    return data?.credits_balance || 0;
}

/**
 * Log credit transaction for audit trail
 * 
 * @param params - Transaction parameters
 */
export async function logCreditTransaction(params: {
    userId: string;
    organizationId?: string;
    executionId?: string;
    creditsBefore: number;
    creditsUsed: number;
    creditsAfter: number;
    transactionType: 'execution' | 'purchase' | 'refund' | 'adjustment';
}): Promise<void> {
    try {
        await supabase.from('credits_transactions').insert({
            user_id: params.userId,
            organization_id: params.organizationId,
            execution_id: params.executionId,
            credits_before: params.creditsBefore,
            credits_used: params.creditsUsed,
            credits_after: params.creditsAfter,
            transaction_type: params.transactionType,
        });
    } catch (error) {
        console.error('[Credits] Transaction logging failed:', error);
    }
}

/**
 * Format credits for display (with commas)
 * 
 * @param credits - Number of credits
 * @returns Formatted string (e.g., "1,000 Credits")
 */
export function formatCredits(credits: number): string {
    return `${credits.toLocaleString('en-US')} Credits`;
}
