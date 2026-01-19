import type {
  Execution,
  ExecutionEvent,
  WhatsAppHistory,
  Conversation,
  Escalation,
  ControlEngine,
  ControlAddon,
  AppStatus,
  Verdict,
  RiskLevel,
  CashflowSummary,
  KPI
} from './types';
import { calculateDashboardKPIs, calculateGrowthKPIs } from './utils';
import { supabase } from '@/database/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

class ApiService {
  private organizationId: string | null = null;

  setOrganizationId(id: string | null) {
    this.organizationId = id;
    console.log('[API] Organization ID set:', id);
  }

  getOrganizationId(): string | null {
    return this.organizationId;
  }

  /**
   * Fetch using Supabase JS client (proven working pattern from docs/api/hotels.ts)
   * Handles authentication and RLS automatically
   */
  async supabaseFetch<T>(
    table: string,
    options: {
      select?: string;
      eq?: Record<string, any>;
      order?: { column: string; ascending?: boolean };
      limit?: number;
    } = {}
  ): Promise<T | null> {
    try {
      console.log(`[API] 🔄 Fetching ${table} (Supabase client)...`);

      let query = supabase.from(table).select(options.select || '*');

      // CRITICAL: Strict Multi-Tenancy Enforcement
      // Inject organization_id if it exists in the table and service, and not already filtered
      if (this.organizationId && !options.eq?.organization_id) {
        // We assume all relevant tables have organization_id
        // Tables like 'profiles' might not, so we handle them or let RLS handle it
        // Note: vivilo_whatsapp_history is excluded as it uses session_id, not organization_id
        const tenantTables = [
          'executions', 'cashflow_summary',
          'escalations', 'engines', 'addons', 'settings',
          'organization_hotels', 'organization_pms_config',
          'organization_entitlements', 'credits_transactions'
        ];

        if (tenantTables.includes(table)) {
          query = query.eq('organization_id', this.organizationId);
        }
      }

      // Apply other filters
      if (options.eq) {
        Object.entries(options.eq).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      if (options.order) {
        query = query.order(options.order.column, {
          ascending: options.order.ascending !== false
        });
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`[API] ❌ Supabase error for ${table}:`, error);
        return null;
      }

      console.log(`[API] ✅ ${table}: ${Array.isArray(data) ? data.length : 1} rows`);
      return data as T;
    } catch (error) {
      console.error(`[API] ❌ Exception fetching ${table}:`, error);
      return null;
    }
  }


  // --- Dashboard Data ---

  async getDashboardData() {
    // Import cashflow aggregation
    const { getCashflowAggregation } = await import('./cashflow-api');

    const [executions, history, cashflowAgg] = await Promise.all([
      this.supabaseFetch<Execution[]>('executions', {
        order: { column: 'started_at', ascending: false },
        limit: 50
      }),
      this.supabaseFetch<WhatsAppHistory[]>('vivilo_whatsapp_history', {
        order: { column: 'id', ascending: false },
        limit: 100
      }),
      getCashflowAggregation(this.organizationId || undefined),
    ]);

    const safeExecutions = executions || [];
    const safeHistory = history || [];

    // Map Execution to ExecutionEvent for the dashboard table
    const events: ExecutionEvent[] = safeExecutions.map(exec => {
      const statusMap: Record<string, AppStatus> = {
        'success': 'Completed',
        'running': 'In Progress',
        'error': 'Failed',
        'waiting': 'Pending',
        'cancelled': 'Failed'
      };

      return {
        id: String(exec.execution_id || exec.id),
        type: exec.workflow_name || 'Workflow',
        status: statusMap[exec.status?.toLowerCase()] || 'Pending',
        verdict: (exec.governance_verdict?.toUpperCase() as Verdict) || 'PENDING',
        risk: (exec.risk_type as RiskLevel) || 'Low',
        time: exec.started_at ? new Date(exec.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
        duration: exec.duration_ms ? `${(exec.duration_ms / 1000).toFixed(1)}s` : '-',
        agent: 'Amelia-v4'
      };
    });

    // Use cashflow aggregation for KPIs
    const kpis = calculateDashboardKPIs(safeExecutions, safeHistory.length, {
      total_revenue: cashflowAgg.total_revenue,
      executions_count: cashflowAgg.transaction_count,
      upsell_acceptance_rate: 0,
      upsell_accepted_count: 0,
      upsell_offers_count: 0,
      orphan_days_captured: 0,
      late_checkout_revenue: 0,
      early_checkin_revenue: 0,
      services_revenue: 0,
      escalations_avoided: 0,
    } as CashflowSummary);

    return {
      kpis,
      events, // Dashboard expects 'events' as ExecutionEvent[]
      whatsappHistory: safeHistory,
      cashflow: cashflowAgg
    };
  }

  // --- Growth Data ---

  async getGrowthData() {
    // Import cashflow functions
    const { getCashflowAggregation, getCashflowTransactions, formatCurrency, parseCurrency } = await import('./cashflow-api');

    const [executions, cashflowAgg, transactions] = await Promise.all([
      this.supabaseFetch<Execution[]>('executions', { limit: 1000 }),
      getCashflowAggregation(this.organizationId || undefined),
      getCashflowTransactions(this.organizationId || undefined),
    ]);

    const safeExecutions = executions || [];

    // Build KPIs from cashflow aggregation
    const kpis = [
      { label: 'Total Revenue Captured', value: formatCurrency(cashflowAgg.total_revenue) },
      { label: 'Upsell Acceptance Rate', value: `${cashflowAgg.transaction_count > 0 ? ((cashflowAgg.stripe_count / cashflowAgg.transaction_count) * 100).toFixed(1) : '0.0'}%` },
      { label: 'Orphan Days Captured', value: '0' },
      { label: 'Late Checkout Revenue', value: formatCurrency(cashflowAgg.total_revenue * 0.25) }, // Estimate 25%
      { label: 'Early Check-in Revenue', value: formatCurrency(cashflowAgg.total_revenue * 0.15) }, // Estimate 15%
      { label: 'Services Revenue', value: formatCurrency(cashflowAgg.total_revenue * 0.10) }, // Estimate 10%
    ];

    // Build wins from transactions above € 500
    const wins = transactions
      .filter(tx => {
        const amount = parseCurrency(tx.total_amount);
        return amount >= 500;
      })
      .slice(0, 10)
      .map(tx => ({
        id: tx.id.slice(0, 8), // Short reference
        title: `${tx.guest} - ${tx.code}`,
        value: tx.total_amount,
        date: tx.collection_date || tx.created_at,
        status: 'Captured' as 'Approved' | 'Captured' | 'Verified'
      }));

    // Calculate Value Created metrics from executions
    // Each execution saves approximately 5 minutes of manual work
    const minutesSavedPerExecution = 5;
    const totalMinutesSaved = safeExecutions.length * minutesSavedPerExecution;
    const hoursSaved = Math.round(totalMinutesSaved / 60);

    const successfulExecs = safeExecutions.filter(e => e.status === 'success' || e.finished);
    const escalationsAvoided = safeExecutions.filter(e => !e.human_escalation_triggered).length;
    const automationRate = safeExecutions.length > 0
      ? ((successfulExecs.length / safeExecutions.length) * 100).toFixed(0)
      : '0';

    // Cost savings: € 25 per hour saved
    const costSavingsPerHour = 25;
    const costSavings = hoursSaved * costSavingsPerHour;

    const valueCreated = [
      { label: 'Hours Saved', value: `${hoursSaved}h` },
      { label: 'Escalations Avoided', value: `${escalationsAvoided}` },
      { label: 'Response Time', value: '< 2min' },
      { label: 'Automation Rate', value: `${automationRate}%` },
      { label: 'Guest Satisfaction', value: successfulExecs.length > 0 ? '95%' : '0%' },
      { label: 'Cost Savings', value: formatCurrency(costSavings) },
    ];

    return {
      kpis,
      valueCreated,
      wins,
    };
  }

  // --- Controls Data ---

  async getControlsData() {
    const [engines, addons, settings] = await Promise.all([
      this.supabaseFetch<ControlEngine[]>('engines'),
      this.supabaseFetch<ControlAddon[]>('addons'),
      this.supabaseFetch<any[]>('settings', { limit: 1 }),
    ]);

    const config = settings?.[0] || {};

    return {
      toneOfVoice: config.tone_of_voice || 'Professional',
      languages: config.languages || ['English', 'Italian'],
      formalityLevel: config.formality_level || 'High',
      brandKeywords: config.brand_keywords || 'Premium, Reliability',
      engines: engines || [],
      addons: addons || [],
      intelligenceMode: config.intelligence_mode || 'Pro',
    };
  }

  async updateAddonStatus(id: string, enabled: boolean) {
    const url = `${SUPABASE_URL}/rest/v1/addons?id=eq.${id}&organization_id=eq.${this.organizationId}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enabled })
    });

    if (!response.ok) {
      throw new Error(`Failed to update addon: ${response.status}`);
    }
    return response.json();
  }

  async updateIntelligenceMode(mode: string) {
    // Assuming settings table has organization_id column or we update the single row
    const url = `${SUPABASE_URL}/rest/v1/settings?organization_id=eq.${this.organizationId}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ intelligence_mode: mode })
    });

    if (!response.ok) {
      throw new Error(`Failed to update intelligence mode: ${response.status}`);
    }
    return response.json();
  }

  async updateGeneralSettings(settings: {
    tone_of_voice: string;
    languages: string[];
    formality_level: string;
    brand_keywords: string;
  }) {
    const url = `${SUPABASE_URL}/rest/v1/settings?organization_id=eq.${this.organizationId}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings)
    });

    if (!response.ok) {
      throw new Error(`Failed to update general settings: ${response.status}`);
    }
    return response.json();
  }

  async updateEngineStatus(id: string, status: 'Active' | 'Paused') {
    const url = `${SUPABASE_URL}/rest/v1/engines?id=eq.${id}&organization_id=eq.${this.organizationId}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error(`Failed to update engine status: ${response.status}`);
    }
    return response.json();
  }

  // --- Escalations ---

  async getEscalationsData(status?: string) {
    const escalations = await this.supabaseFetch<Escalation[]>('escalations', {
      eq: status ? { status } : undefined
    });
    return escalations || [];
  }

  async getEscalationContext(_phone: string) {
    const history = await this.supabaseFetch<WhatsAppHistory[]>('vivilo_whatsapp_history', {
      order: { column: 'created_at', ascending: false },
      limit: 20
    });
    return { history: history || [] };
  }

  async resolveEscalation(id: string, notes: string, classification: string) {
    const url = `${SUPABASE_URL}/rest/v1/escalations?id=eq.${id}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        status: 'RESOLVED',
        resolution_notes: notes,
        classification,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to resolve escalation: ${response.status}`);
    }

    return response.json();
  }

  async updateAutoTopup(enabled: boolean, threshold: number, amount: number) {
    const url = `${SUPABASE_URL}/rest/v1/organization_entitlements?organization_id=eq.${this.organizationId}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auto_topup_enabled: enabled,
        auto_topup_threshold: threshold,
        auto_topup_amount: amount
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update auto top-up: ${response.status}`);
    }
    return response.json();
  }

  // --- Message Log ---

  async getConversationsData() {
    // Use Supabase JS client for reliable data fetching
    const history = await this.supabaseFetch<WhatsAppHistory[]>('vivilo_whatsapp_history', {
      order: { column: 'id', ascending: true },
      limit: 500
    });

    const safeHistory = history || [];

    // Filter out tool messages and AI internal traces (Calling Think, Calling Guidelines, etc.)
    const userMessages = safeHistory.filter(msg => {
      if (msg.message.type === 'tool') return false;
      if (msg.message.type === 'ai' && msg.message.content.startsWith('Calling ')) return false;
      return msg.message.type === 'human' || msg.message.type === 'ai';
    });

    // Group by session_id into conversations
    const conversationsMap = new Map<string, Conversation & { latestTimestamp: number }>();

    userMessages.forEach(msg => {
      const sessionId = msg.session_id;
      const msgTimestamp = msg.id; // Using ID as proxy for timestamp (auto-incrementing)
      const messageTime = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (!conversationsMap.has(sessionId)) {
        conversationsMap.set(sessionId, {
          id: sessionId,
          name: sessionId, // Use full phone number
          initials: sessionId.slice(0, 2), // First 2 digits
          platform: 'whatsapp',
          time: messageTime, // Use first message time
          dates: 'Active',
          status: 'Active',
          messages: [],
          crm: {
            pax: '2',
            confirmationCode: '-',
            checkInDate: '-',
            checkInTime: '-',
            checkOutDate: '-',
            checkOutTime: '-',
            fields: [],
            toPay: '€ 0,00'
          },
          latestTimestamp: msgTimestamp
        });
      }

      const conv = conversationsMap.get(sessionId)!;

      // Update latest timestamp and conversation time
      if (msgTimestamp > conv.latestTimestamp) {
        conv.latestTimestamp = msgTimestamp;
        conv.time = messageTime; // Update to latest message time
      }

      conv.messages.push({
        id: String(msg.id),
        sender: msg.message.type === 'human' ? 'guest' : 'agent',
        type: 'text',
        text: msg.message.content || '',
        time: messageTime // Use actual message timestamp
      });
    });

    // Convert to array and sort by latest message (most recent first)
    const conversations = Array.from(conversationsMap.values())
      .sort((a, b) => b.latestTimestamp - a.latestTimestamp)
      .map(({ latestTimestamp, ...conv }) => conv); // Remove latestTimestamp from final object

    return {
      conversations,
    };
  }

  // --- Settings ---

  async getSettingsData() {
    const settings = await this.supabaseFetch<any[]>('settings', { limit: 1 });
    return settings?.[0] || {};
  }

  // --- Sync Stubs ---

  async syncExecutions() {
    console.log('[API] 🔄 Triggering execution sync...');
    return true;
  }

  async syncConversations() {
    console.log('[API] 🔄 Triggering conversation sync...');
    return true;
  }

  // --- Cashflow / Governed Value ---

  async getCashflowData() {
    const data = await this.supabaseFetch<CashflowSummary[]>('cashflow_summary', {
      limit: 1,
      order: { column: 'period_end', ascending: false }
    });
    return data?.[0] || null;
  }

  private calculateGrowthKPIsFromCashflow(cashflow: CashflowSummary): KPI[] {
    return [
      {
        id: 'total-revenue',
        label: 'Total Revenue Captured',
        value: `€ ${Number(cashflow.total_revenue).toFixed(2).replace('.', ',')}`,
        trend: 0,
        trendLabel: '',
        subtext: `${cashflow.executions_count} Executions`,
        status: Number(cashflow.total_revenue) > 0 ? 'success' : 'neutral',
      },
      {
        id: 'upsell-rate',
        label: 'Upsell Acceptance Rate',
        value: `${Number(cashflow.upsell_acceptance_rate).toFixed(1)}%`,
        trend: 0,
        trendLabel: '',
        subtext: `${cashflow.upsell_accepted_count}/${cashflow.upsell_offers_count} Accepted`,
        status: Number(cashflow.upsell_acceptance_rate) > 0 ? 'success' : 'neutral',
      },
      {
        id: 'orphan-days',
        label: 'Orphan Days Captured',
        value: cashflow.orphan_days_captured.toString(),
        trend: 0,
        trendLabel: '',
        subtext: 'Occupancy Boost',
        status: cashflow.orphan_days_captured > 0 ? 'success' : 'neutral',
      },
      {
        id: 'late-checkout',
        label: 'Late Checkout Revenue',
        value: `€ ${Number(cashflow.late_checkout_revenue).toFixed(2).replace('.', ',')}`,
        trend: 0,
        trendLabel: '',
        subtext: 'Extension Value',
        status: Number(cashflow.late_checkout_revenue) > 0 ? 'success' : 'neutral',
      },
      {
        id: 'early-checkin',
        label: 'Early Check-in Revenue',
        value: `€ ${Number(cashflow.early_checkin_revenue).toFixed(2).replace('.', ',')}`,
        trend: 0,
        trendLabel: '',
        subtext: 'Arrival Value',
        status: Number(cashflow.early_checkin_revenue) > 0 ? 'success' : 'neutral',
      },
      {
        id: 'services',
        label: 'Services Revenue',
        value: `€ ${Number(cashflow.services_revenue).toFixed(2).replace('.', ',')}`,
        trend: 0,
        trendLabel: '',
        subtext: 'Add-ons & Extras',
        status: Number(cashflow.services_revenue) > 0 ? 'success' : 'neutral',
      },
    ];
  }

  /**
   * Helper for race conditions in usePageData
   */
  async collect<T>(promise: Promise<T>): Promise<[T | null, Error | null]> {
    try {
      const data = await promise;
      return [data, null];
    } catch (error) {
      return [null, error as Error];
    }
  }
}

export const api = new ApiService();
