import { supabase } from '@/database/supabase';

/**
 * Cashflow API Service
 * Handles fetching and managing cashflow summary data
 */

export interface CashflowSummary {
    id: string;
    organization_id?: string;
    period_start: string;
    period_end: string;
    total_revenue: number;
    upsell_revenue: number;
    late_checkout_revenue: number;
    early_checkin_revenue: number;
    services_revenue: number;
    orphan_days_revenue: number;
    upsell_offers_count: number;
    upsell_accepted_count: number;
    upsell_acceptance_rate: number;
    orphan_days_captured: number;
    hours_saved: number;
    escalations_avoided: number;
    currency: string;
    executions_count: number;
    created_at: string;
    updated_at: string;
}

/**
 * Get latest cashflow summary
 */
export async function getLatestCashflowSummary(organizationId: string): Promise<CashflowSummary | null> {
    const { data, error } = await supabase
        .from('cashflow_summary')
        .select('*')
        .eq('organization_id', organizationId)
        .order('period_end', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error('[Cashflow] Error fetching summary:', error);
        return null;
    }

    return data;
}

/**
 * Get cashflow summaries for a date range
 */
export async function getCashflowSummaries(
    organizationId: string,
    startDate?: string,
    endDate?: string
): Promise<CashflowSummary[]> {
    let query = supabase
        .from('cashflow_summary')
        .select('*')
        .eq('organization_id', organizationId)
        .order('period_start', { ascending: false });

    if (startDate) {
        query = query.gte('period_start', startDate);
    }

    if (endDate) {
        query = query.lte('period_end', endDate);
    }

    const { data, error } = await query;

    if (error) {
        console.error('[Cashflow] Error fetching summaries:', error);
        return [];
    }

    return data || [];
}

/**
 * Refresh cashflow summary from executions
 * This should be called by n8n Governed Cashflow workflow
 */
export async function refreshCashflowSummary(
    organizationId: string,
    _periodStart: string,
    _periodEnd: string
): Promise<CashflowSummary | null> {
    // This will be called by n8n workflow after it processes data
    // For now, we just fetch the latest
    return getLatestCashflowSummary(organizationId);
}
