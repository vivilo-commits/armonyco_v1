import { supabase } from '@/database/supabase';

/**
 * Cashflow API Service
 * Handles fetching and managing cashflow data from the new table structure
 */

// New table schema: guest, code, management_date, collection_date, payment_method, quantity, total_amount, operator
export interface CashflowTransaction {
    id: string;
    organization_id?: string;
    guest: string;
    code: string;
    management_date: string;
    collection_date: string;
    payment_method: string;
    quantity: number;
    total_amount: string; // "€ 56,00" format
    operator?: string;
    created_at: string;
}

export interface CashflowAggregation {
    total_revenue: number;
    transaction_count: number;
    cash_count: number;
    stripe_count: number;
    transfer_count: number;
    avg_transaction: number;
}

/**
 * Parse currency string to number
 * Converts "€ 56,00" or "€56,00" to 56.00
 */
export function parseCurrency(value: string): number {
    if (!value) return 0;
    // Remove € symbol, spaces, and convert comma to dot
    const cleaned = value
        .replace('€', '')
        .replace(/\s/g, '')
        .replace(',', '.');
    return parseFloat(cleaned) || 0;
}

/**
 * Get all cashflow transactions
 */
export async function getCashflowTransactions(organizationId?: string): Promise<CashflowTransaction[]> {
    let query = supabase
        .from('cashflow_summary')
        .select('*')
        .order('collection_date', { ascending: false });

    if (organizationId) {
        query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('[Cashflow] Error fetching transactions:', error);
        return [];
    }

    return data || [];
}

/**
 * Get aggregated cashflow summary for Dashboard
 */
export async function getCashflowAggregation(organizationId?: string): Promise<CashflowAggregation> {
    const transactions = await getCashflowTransactions(organizationId);

    const totals = transactions.reduce((acc, tx) => {
        const amount = parseCurrency(tx.total_amount);
        acc.total_revenue += amount;
        acc.transaction_count += 1;

        const method = tx.payment_method?.toLowerCase() || '';
        if (method.includes('contanti') || method.includes('cash')) {
            acc.cash_count += 1;
        } else if (method.includes('stripe')) {
            acc.stripe_count += 1;
        } else if (method.includes('bonifico') || method.includes('transfer')) {
            acc.transfer_count += 1;
        }

        return acc;
    }, {
        total_revenue: 0,
        transaction_count: 0,
        cash_count: 0,
        stripe_count: 0,
        transfer_count: 0,
        avg_transaction: 0
    });

    totals.avg_transaction = totals.transaction_count > 0
        ? totals.total_revenue / totals.transaction_count
        : 0;

    return totals;
}

/**
 * Get cashflow for specific date range
 */
export async function getCashflowForPeriod(
    startDate: string,
    endDate: string,
    organizationId?: string
): Promise<CashflowTransaction[]> {
    let query = supabase
        .from('cashflow_summary')
        .select('*')
        .gte('collection_date', startDate)
        .lte('collection_date', endDate)
        .order('collection_date', { ascending: false });

    if (organizationId) {
        query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('[Cashflow] Error fetching period data:', error);
        return [];
    }

    return data || [];
}

/**
 * Format currency for display (European format with dots for thousands)
 * Example: 179917.92 → "€ 179.917,92"
 */
export function formatCurrency(value: number): string {
    return `€ ${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
