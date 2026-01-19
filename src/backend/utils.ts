import type { KPI, Execution, BadgeVariant, Verdict, RiskLevel, Priority, CashflowSummary } from './types';

// DATE UTILITIES
export function formatRelativeTime(dateStr?: string): string {
    const date = dateStr ? new Date(dateStr) : new Date();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
}

export function calculateDuration(startTime: string, endTime: string): string {
    const diffMs = new Date(endTime).getTime() - new Date(startTime).getTime();
    if (diffMs < 1000) return `${diffMs}ms`;
    return `${(diffMs / 1000).toFixed(1)}s`;
}

// KPI CALCULATION
export function calculateDashboardKPIs(
    executions: Execution[],
    messagesCount: number = 0,
    cashflow?: CashflowSummary | null
): KPI[] {
    const totalCount = executions.length;
    const successCount = executions.filter((e) => e.status === 'success' || e.finished).length;
    const failedCount = executions.filter((e) => e.status === 'failed' || e.status === 'error').length;

    const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 100;
    const failureRate = totalCount > 0 ? ((failedCount / totalCount) * 100).toFixed(1) : '0.0';

    // Governed Value comes from cashflow_summary if available
    const totalValue = cashflow
        ? Number(cashflow.total_revenue)
        : executions.reduce((acc, curr) => acc + (Number(curr.total_charge) || 0) + (Number(curr.value_captured) || 0), 0);

    const openEscalations = cashflow
        ? (cashflow.escalations_avoided ? 0 : executions.filter((e) => e.human_escalation_triggered && e.escalation_status !== 'Resolved').length)
        : executions.filter((e) => e.human_escalation_triggered && e.escalation_status !== 'Resolved').length;

    // We can use escalations_avoided as a positive metric too, but the KPI is for "Open"



    const latencies = executions
        .filter((e) => e.duration_ms || (e.started_at && e.stopped_at))
        .map((e) => {
            if (e.duration_ms) return e.duration_ms;
            return new Date(e.stopped_at!).getTime() - new Date(e.started_at!).getTime();
        })
        .sort((a, b) => a - b);

    const p50 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.5)] : 0;
    const medianTime = p50 > 0 ? (p50 / 1000).toFixed(1) + 's' : '--';

    const passedGovernance = executions.filter((e) => e.governance_verdict?.toUpperCase() === 'PASSED').length;
    const decisionIntegrity = totalCount > 0 ? ((passedGovernance / totalCount) * 100).toFixed(1) : '100.0';

    const totalTimeSaved = executions.reduce((acc, curr) => acc + (curr.time_saved_seconds || 0), 0);
    const avgTimeSaved = totalCount > 0 ? Math.round(totalTimeSaved / totalCount) : 0;

    const laraExecutions = executions.filter((e) => e.workflow_name?.toLowerCase() === 'lara')
        .reduce((acc, curr) => acc + (curr.messages_sent || 0), 0);

    return [
        {
            id: 'total-value',
            label: 'Governed Value',
            value: totalValue > 0 ? `€ ${totalValue >= 1000 ? (totalValue / 1000).toFixed(1) + 'k' : totalValue.toFixed(2).replace('.', ',')}` : '€ 0,00',
            trend: 0,
            trendLabel: 'Real-time',
            subtext: 'Institutional ROI',
            status: 'success',
        },
        {
            id: 'ai-resolution',
            label: 'AI Resolution Rate',
            value: `${successRate}%`,
            trend: 0,
            trendLabel: 'Stable',
            subtext: 'Autonomous closure',
            status: successRate >= 90 ? 'success' : successRate >= 70 ? 'warning' : 'error',
        },
        {
            id: 'open-escalations',
            label: 'Open Escalations',
            value: openEscalations.toString(),
            trend: 0,
            trendLabel: 'Human Required',
            subtext: 'Active human req.',
            status: openEscalations > 0 ? 'warning' : 'success',
        },
        {
            id: 'median-cycle',
            label: 'Median Cycle Time',
            value: medianTime,
            trend: 0,
            trendLabel: 'Optimal',
            subtext: 'Processing speed',
            status: 'neutral',
        },
        {
            id: 'messages-sent',
            label: 'Message Sent',
            value: (messagesCount || executions.reduce((acc, curr) => acc + (curr.messages_sent || 0), 0)).toString(),
            trend: 0,
            trendLabel: 'Communications',
            subtext: 'WhatsApp History',
            status: 'success',
        },
        {
            id: 'templates-sent',
            label: 'Template Sent',
            value: laraExecutions.toString(),
            trend: 0,
            trendLabel: 'Lara Agent',
            subtext: 'Automated Outreach',
            status: 'success',
        },
        // --- SECOND STORY: SYSTEM HEALTH ---
        {
            id: 'total-executions',
            label: 'Total Executions',
            value: totalCount.toString(),
            trend: 0,
            trendLabel: 'Operational',
            subtext: 'Node volume',
            status: 'neutral',
        },
        {
            id: 'failed-executions',
            label: 'Failed Executions',
            value: failedCount.toString(),
            trend: 0,
            trendLabel: 'Interruptions',
            subtext: 'System health',
            status: failedCount > 0 ? 'error' : 'success',
        },
        {
            id: 'failure-rate',
            label: 'Failure Rate',
            value: `${failureRate}%`,
            trend: 0,
            trendLabel: 'Reliability',
            subtext: 'Stability signal',
            status: parseFloat(failureRate) < 5 ? 'success' : 'warning',
        },
        {
            id: 'avg-runtime',
            label: 'Average Runtime',
            value: medianTime,
            trend: 0,
            trendLabel: 'Verified',
            subtext: 'Execution speed',
            status: 'success',
        },
        {
            id: 'decision-integrity',
            label: 'Decision Integrity',
            value: `${decisionIntegrity}%`,
            trend: 0,
            trendLabel: 'Governance',
            subtext: 'Policy alignment',
            status: parseFloat(decisionIntegrity) >= 98 ? 'success' : 'warning',
        },
        {
            id: 'avg-time-saved',
            label: 'Avg Time Saved',
            value: `${avgTimeSaved}s`,
            trend: 0,
            trendLabel: 'Efficiency',
            subtext: 'Labor reclaimed',
            status: 'success',
        }
    ];
}

export function calculateGrowthKPIs(executions: Execution[]): KPI[] {
    // Calculate total revenue captured
    const totalRevenue = executions.reduce((sum, exec) => sum + (exec.value_captured || 0), 0);

    // Calculate upsell acceptance rate
    const upsellOffers = executions.filter(e => e.upsell_offered).length;
    const upsellAccepted = executions.filter(e => e.upsell_accepted).length;
    const upsellRate = upsellOffers > 0 ? (upsellAccepted / upsellOffers) * 100 : 0;

    // Calculate orphan days
    const orphanDays = executions.reduce((sum, exec) => sum + (exec.orphan_days_count || 0), 0);

    // Calculate specific revenue streams
    const lateCheckoutRevenue = executions.reduce((sum, exec) => sum + (exec.late_checkout_value || 0), 0);
    const earlyCheckinRevenue = executions.reduce((sum, exec) => sum + (exec.early_checkin_value || 0), 0);
    const servicesRevenue = executions.reduce(
        (sum, exec) => sum + (exec.services_value || 0) + (exec.breakfast_value || 0) + (exec.transfer_value || 0),
        0
    );

    return [
        {
            id: 'total-revenue',
            label: 'Total Revenue Captured',
            value: `€ ${totalRevenue.toFixed(2).replace('.', ',')}`,
            trend: 0,
            trendLabel: '',
            subtext: `${executions.length} Executions`,
            status: totalRevenue > 0 ? 'success' : 'neutral',
        },
        {
            id: 'upsell-rate',
            label: 'Upsell Acceptance Rate',
            value: `${upsellRate.toFixed(1)}%`,
            trend: 0,
            trendLabel: '',
            subtext: `${upsellAccepted}/${upsellOffers} Accepted`,
            status: upsellRate > 0 ? 'success' : 'neutral',
        },
        {
            id: 'orphan-days',
            label: 'Orphan Days Captured',
            value: orphanDays.toString(),
            trend: 0,
            trendLabel: '',
            subtext: 'Occupancy Boost',
            status: orphanDays > 0 ? 'success' : 'neutral',
        },
        {
            id: 'late-checkout',
            label: 'Late Checkout Revenue',
            value: `€ ${lateCheckoutRevenue.toFixed(2).replace('.', ',')}`,
            trend: 0,
            trendLabel: '',
            subtext: 'Extension Value',
            status: lateCheckoutRevenue > 0 ? 'success' : 'neutral',
        },
        {
            id: 'early-checkin',
            label: 'Early Check-in Revenue',
            value: `€ ${earlyCheckinRevenue.toFixed(2).replace('.', ',')}`,
            trend: 0,
            trendLabel: '',
            subtext: 'Arrival Value',
            status: earlyCheckinRevenue > 0 ? 'success' : 'neutral',
        },
        {
            id: 'services',
            label: 'Services Revenue',
            value: `€ ${servicesRevenue.toFixed(2).replace('.', ',')}`,
            trend: 0,
            trendLabel: '',
            subtext: 'Add-ons & Extras',
            status: servicesRevenue > 0 ? 'success' : 'neutral',
        },
    ];
}

// FORMATTING & NORMALIZERS
export function normalizeColumnName(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

export function getStatusVariant(status: string): BadgeVariant {
    const s = status.toLowerCase();
    if (s === 'completed' || s === 'success' || s === 'active') return 'success';
    if (s === 'failed' || s === 'error') return 'error';
    if (s === 'in progress' || s === 'pending' || s === 'warning') return 'warning';
    return 'neutral';
}

export function getPriorityVariant(priority: string): BadgeVariant {
    const p = priority.toLowerCase();
    if (p === 'critical') return 'error';
    if (p === 'high') return 'warning';
    if (p === 'medium') return 'info';
    return 'neutral';
}

export function normalizeStatus(status: string): string {
    const s = status?.toLowerCase();
    if (s === 'success' || s === 'finished') return 'Completed';
    if (s === 'failed' || s === 'error') return 'Failed';
    if (s === 'pending' || s === 'running') return 'In Progress';
    return status || 'Pending';
}

export function normalizePlatform(channel: string): string {
    const c = channel?.toLowerCase();
    if (c === 'whatsapp') return 'WhatsApp';
    if (c === 'booking') return 'Booking.com';
    if (c === 'airbnb') return 'Airbnb';
    if (c === 'expedia') return 'Expedia';
    return channel || 'Direct';
}

export function normalizePriority(priority: string): Priority {
    const p = priority?.toLowerCase();
    if (p === 'critical' || p === 'urgent') return 'Critical';
    if (p === 'high') return 'High';
    if (p === 'medium') return 'Medium';
    return 'Low';
}

export function normalizeRiskLevel(level: string): RiskLevel {
    return normalizePriority(level) as RiskLevel;
}

export function normalizeVerdict(verdict: string | null | undefined): Verdict {
    const v = verdict?.toUpperCase();
    if (v === 'PASSED' || v === 'OK') return 'PASSED';
    if (v === 'FLAGGED' || v === 'WARNING') return 'FLAGGED';
    return 'FAILED';
}

export function getStatusColor(status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
    const s = status.toLowerCase();
    if (['success', 'active', 'passed', 'resolved', 'confirmed'].includes(s)) return 'success';
    if (['pending', 'in_progress', 'warning', 'trialing'].includes(s)) return 'warning';
    if (['failed', 'error', 'canceled', 'blocked', 'critical'].includes(s)) return 'error';
    return 'info';
}
