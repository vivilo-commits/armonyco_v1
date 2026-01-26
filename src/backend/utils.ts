import type { KPI, Execution, BadgeVariant, Verdict, RiskLevel, Priority, CashflowSummary, CashflowTransaction } from './types';

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
    cashflow?: CashflowSummary | null,
    openEscalationsCount?: number
): KPI[] {
    // ✅ FIX: Only count FINISHED executions for metrics
    const finishedExecutions = executions.filter(e => e.finished || e.stopped_at);
    const totalCount = finishedExecutions.length;

    const successCount = finishedExecutions.filter((e) => e.status === 'success' || e.finished).length;
    const failedCount = finishedExecutions.filter((e) => e.status === 'failed' || e.status === 'error').length;

    const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 100;
    const failureRate = totalCount > 0 ? ((failedCount / totalCount) * 100).toFixed(1) : '0.0';

    // Governed Value comes from cashflow_summary if available
    const totalValue = cashflow
        ? Number(cashflow.total_revenue)
        : executions.reduce((acc, curr) => acc + (Number(curr.total_charge) || 0) + (Number(curr.value_captured) || 0), 0);

    // Use the provided openEscalationsCount if available (from unified getEscalationsData),
    // otherwise fall back to the legacy calculation from executions
    const openEscalations = openEscalationsCount !== undefined
        ? openEscalationsCount
        : executions.filter((e) =>
            (e.human_escalation_triggered || e.escalation_status || e.escalation_priority) &&
            e.escalation_status?.toUpperCase() !== 'RESOLVED'
        ).length;

    // ✅ FIX: Only calculate latency for FINISHED executions
    const latencies = finishedExecutions
        .filter((e) => e.started_at && e.stopped_at)
        .map((e) => {
            return new Date(e.stopped_at!).getTime() - new Date(e.started_at!).getTime();
        })
        .sort((a, b) => a - b);

    const p50 = latencies.length > 0 ? latencies[Math.floor(latencies.length * 0.5)] : 0;
    const medianTime = p50 > 0 ? (p50 / 1000).toFixed(1) + 's' : '--';

    const failedGovernance = finishedExecutions.filter((e) => e.governance_verdict?.toUpperCase() === 'FAILED').length;
    // Decision Integrity = % of decisions that passed governance (100% = perfect, 0% = all failed)
    const decisionIntegrity = totalCount > 0
        ? (100 - ((failedGovernance / totalCount) * 100)).toFixed(1)
        : '100.0'; // Default to 100% when no data (no failures = perfect integrity)

    const totalTimeSaved = finishedExecutions.reduce((acc, curr) => acc + (curr.time_saved_seconds || 0), 0);
    const avgTimeSaved = totalCount > 0 ? Math.round(totalTimeSaved / totalCount) : 0;

    // Count Lara executions - each Lara workflow execution = 1 template sent
    const laraTemplatesSent = executions.filter((e) => e.workflow_name?.toLowerCase() === 'lara').length;

    return [
        {
            id: 'total-value',
            label: 'Value Under Governance',
            value: totalValue > 0 ? `€ ${totalValue >= 1000 ? (totalValue / 1000).toFixed(1) + 'k' : totalValue.toFixed(2).replace('.', ',')}` : '€ 0,00',
            trend: 0,
            trendLabel: 'Real-time',
            subtext: 'Revenue and operational value currently governed by the system.',
            status: 'success',
        },
        {
            id: 'ai-resolution',
            label: 'Autonomous Resolution',
            value: `${successRate}%`,
            trend: 0,
            trendLabel: 'Stable',
            subtext: 'Decisions resolved without human intervention',
            status: successRate >= 90 ? 'success' : successRate >= 70 ? 'warning' : 'error',
        },
        {
            id: 'open-escalations',
            label: 'Human-Required Interventions',
            value: openEscalations.toString(),
            trend: 0,
            trendLabel: 'Attention Needed',
            subtext: 'Only events requiring judgment appear here.',
            status: openEscalations > 0 ? 'warning' : 'success',
        },
        {
            id: 'median-cycle',
            label: 'Decision Latency',
            value: medianTime,
            trend: 0,
            trendLabel: 'Optimal',
            subtext: 'Time from signal to resolution.',
            status: 'neutral',
        },
        {
            id: 'messages-sent',
            label: 'Message Sent',
            value: messagesCount.toString(),
            trend: 0,
            trendLabel: 'Communications',
            subtext: 'WhatsApp History',
            status: 'success',
        },
        {
            id: 'templates-sent',
            label: 'Template Sent',
            value: laraTemplatesSent.toString(),
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
            label: 'Human Load Removed',
            value: `${(avgTimeSaved / 60).toFixed(1)}m`,
            trend: 0,
            trendLabel: 'Efficiency',
            subtext: 'Time reclaimed from manual operations.',
            status: 'success',
        }
    ];
}


export function calculateGrowthKPIs(_executions: Execution[], cashflowTransactions: CashflowTransaction[] = []): KPI[] {
    // Helper to categorize transactions by amount patterns
    const categorizeTransaction = (tx: CashflowTransaction) => {
        const amount = parseCurrency(tx.total_amount);

        // City tax amounts (€7 per person per night - common patterns)
        const cityTaxAmounts = [7, 14, 21, 28, 35, 42, 49, 56];
        const isCityTax = cityTaxAmounts.includes(Math.round(amount));

        // Small service fees (likely late checkout, early checkin)
        const isSmallService = amount > 0 && amount <= 50 && !isCityTax;

        // Medium services (likely breakfast, transfer)
        const isMediumService = amount > 50 && amount <= 150;

        return {
            amount,
            isCityTax,
            isLikelyCheckoutFee: isSmallService && amount >= 15 && amount <= 40,
            isLikelyCheckinFee: isSmallService && amount >= 10 && amount <= 35,
            isLikelyBreakfast: isMediumService,
            isService: isCityTax || isSmallService || isMediumService,
        };
    };

    // Analyze cashflow transactions
    const categorized = cashflowTransactions.map(categorizeTransaction);

    // Calculate revenue by category
    const cityTaxRevenue = categorized
        .filter(c => c.isCityTax)
        .reduce((sum, c) => sum + c.amount, 0);

    const lateCheckoutRevenue = categorized
        .filter(c => c.isLikelyCheckoutFee)
        .reduce((sum, c) => sum + c.amount, 0);

    const earlyCheckinRevenue = categorized
        .filter(c => c.isLikelyCheckinFee)
        .reduce((sum, c) => sum + c.amount, 0);

    const breakfastRevenue = categorized
        .filter(c => c.isLikelyBreakfast)
        .reduce((sum, c) => sum + c.amount, 0);

    const servicesRevenue = cityTaxRevenue + lateCheckoutRevenue + earlyCheckinRevenue + breakfastRevenue;

    // Total revenue from services
    const totalRevenue = servicesRevenue;

    // Count service transactions
    const serviceTransactions = categorized.filter(c => c.isService).length;

    // Simplified upsell rate (service transactions / total transactions)
    const totalTransactions = cashflowTransactions.length;
    const upsellRate = totalTransactions > 0 ? (serviceTransactions / totalTransactions) * 100 : 0;

    return [
        {
            id: 'total-revenue',
            label: 'Revenue Governed',
            value: formatCurrency(totalRevenue),
            trend: 0,
            trendLabel: '',
            subtext: `Upsells, extensions and opportunities handled automatically.`,
            status: totalRevenue > 0 ? 'success' : 'neutral',
        },
        {
            id: 'upsell-rate',
            label: 'Guest Conversion Efficiency',
            value: `${upsellRate.toFixed(1)}%`,
            trend: 0,
            trendLabel: '',
            subtext: `Percentage of accepted system-driven offers.`,
            status: upsellRate > 0 ? 'success' : 'neutral',
        },
        {
            id: 'orphan-days',
            label: 'Orphan Days Captured',
            value: '0',
            trend: 0,
            trendLabel: '',
            subtext: 'Requires Lara Data',
            status: 'neutral',
        },
        {
            id: 'late-checkout',
            label: 'Late Checkout Revenue',
            value: formatCurrency(lateCheckoutRevenue),
            trend: 0,
            trendLabel: '',
            subtext: 'Extension Value',
            status: lateCheckoutRevenue > 0 ? 'success' : 'neutral',
        },
        {
            id: 'early-checkin',
            label: 'Early Check-in Revenue',
            value: formatCurrency(earlyCheckinRevenue),
            trend: 0,
            trendLabel: '',
            subtext: 'Arrival Value',
            status: earlyCheckinRevenue > 0 ? 'success' : 'neutral',
        },
        {
            id: 'services',
            label: 'Services Revenue',
            value: formatCurrency(breakfastRevenue + cityTaxRevenue),
            trend: 0,
            trendLabel: '',
            subtext: 'Breakfast & City Tax',
            status: (breakfastRevenue + cityTaxRevenue) > 0 ? 'success' : 'neutral',
        },
    ];
}

// FORMATTING & NORMALIZERS
export function normalizePhone(phone: string): string {
    if (!phone) return '';
    // Strip everything except numbers and leading +
    const cleaned = phone.replace(/[^\d+]/g, '');
    // If it starts with +39 or 39, ensure consistency (business logic specific)
    // For now, just return the cleaned digits to match vivilo_whatsapp_history session_id format
    return cleaned.replace(/^\+/, '');
}

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

/**
 * Parse currency string to number
 * Converts "€ 56,00" or "€56,00" to 56.00
 */
export function parseCurrency(value: string): number {
    if (!value) return 0;
    // Remove € symbol and all white spaces
    let cleaned = value.replace('€', '').replace(/\s/g, '');

    // European format check: if there's a comma, it's the decimal separator
    // and dots are thousand separators.
    if (cleaned.includes(',')) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }

    return parseFloat(cleaned) || 0;
}

/**
 * Format currency for display (European format with dots for thousands)
 * Example: 179917.92 → "€ 179.917,92"
 */
export function formatCurrency(value: number): string {
    return `€ ${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function cleanMessageContent(content: string): string {
    if (!content) return '';

    const trimmed = content.trim();

    // 1. Filter out internal AI process logs and Think tool traces
    if (trimmed.startsWith('Calling Think with input:')) return '';
    if (trimmed.startsWith('Calling ') && trimmed.includes(' with input:')) return '';
    if (trimmed.startsWith('Analyze guest input:')) return '';
    if (trimmed.startsWith('Think:')) return '';
    if (trimmed.startsWith('Thinking:')) return '';

    // 2. Handle JSON-formatted responses (objects or arrays)
    const isJsonObject = trimmed.startsWith('{') && trimmed.endsWith('}');
    const isJsonArray = trimmed.startsWith('[') && trimmed.endsWith(']');

    if (isJsonObject || isJsonArray) {
        try {
            const parsed = JSON.parse(trimmed);

            // Case: Array of objects (tool outputs, PMS data, etc.)
            if (Array.isArray(parsed)) {
                // Check if this looks like PMS/tool data (has row_number, Codice, etc.)
                if (parsed.length > 0 && parsed[0]) {
                    const firstItem = parsed[0];
                    const toolDataKeys = ['row_number', 'Codice', 'Riferimento', 'Arrivo', 'Partenza', 'Camere', 'Ospiti'];
                    const hasToolData = toolDataKeys.some(key => key in firstItem);
                    if (hasToolData) {
                        // This is tool/PMS output, filter it out
                        return '';
                    }
                }
                // Check for response in array
                if (parsed[0]?.response) return parsed[0].response;
                // If it's an array of strings, join them
                if (parsed.every((item: any) => typeof item === 'string')) {
                    return parsed.join(' ');
                }
                // Otherwise filter out as internal data
                return '';
            }

            // Case: Single object
            if (typeof parsed === 'object' && parsed !== null) {
                // Check for tool data indicators
                const toolDataKeys = ['row_number', 'Codice', 'Riferimento', 'Arrivo', 'Partenza', 'Camere', 'Ospiti', 'tool_calls'];
                const hasToolData = toolDataKeys.some(key => key in parsed);
                if (hasToolData) {
                    return '';
                }

                // Extract response if present
                if (parsed.response) return parsed.response;
                if (parsed.message) return parsed.message;
                if (parsed.text) return parsed.text;
                if (parsed.content) return cleanMessageContent(parsed.content);

                // Filter out objects without clear user-facing content
                return '';
            }

            return typeof parsed === 'string' ? parsed : '';
        } catch (e) {
            // Not valid JSON or parsing failed, fall back to original content
        }
    }

    // 3. Filter out tool call traces that weren't caught as JSON
    // Specifically filter out strings starting with "time: " (typical Think tool output)
    if (trimmed.toLowerCase().startsWith('time: ') && trimmed.toLowerCase().includes('plan:')) {
        return '';
    }

    if (trimmed.includes('"tool_calls"') || trimmed.includes('"row_number"') || trimmed.toLowerCase().includes('escalate yes')) {
        return '';
    }

    return content;
}
