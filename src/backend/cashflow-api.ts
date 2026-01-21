import { parseCurrency, formatCurrency } from './utils';

/**
 * Cashflow API Service
 * Handles manual cashflow tracking and aggregations
 */

export interface CashflowTransaction {
    id: string;
    organization_id: string;
    guest: string;
    code: string;
    total_amount: string; // From DB as formatted string (e.g., "€ 1.250,00")
    total_amount_eur: number; // For internal calculations
    payment_method: string;
    collection_date: string;
    created_at: string;
}

export interface CashflowAggregation {
    total_revenue: number;
    transaction_count: number;
    avg_transaction: number;
    cash_count: number;
    stripe_count: number;
    transfer_count: number;
}

export { parseCurrency, formatCurrency };
import { supabase } from '@/database/supabase';

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
