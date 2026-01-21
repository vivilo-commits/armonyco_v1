import type {
  AppStatus,
  ControlAddon,
  ControlEngine,
  Escalation,
  Execution,
  ExecutionEvent,
  Verdict,
  WhatsAppHistory,
  CashflowSummary,
  Conversation
} from './types';
import { CashflowTransaction } from './cashflow-api';
import { calculateDashboardKPIs, cleanMessageContent, parseCurrency, formatCurrency, calculateGrowthKPIs } from './utils';
export { parseCurrency, formatCurrency };
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
        const tenantTables = [
          'executions', 'cashflow_summary', 'escalations',
          'engines', 'addons', 'settings',
          'organization_hotels', 'organization_pms_config',
          'organization_entitlements', 'credits_transactions',
          'vivilo_whatsapp_history'
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
        console.error(`[API] ❌ Supabase error for ${table}: `, error);
        return null;
      }

      console.log(`[API] ✅ ${table}: ${Array.isArray(data) ? data.length : 1} rows`);
      return data as T;
    } catch (error) {
      console.error(`[API] ❌ Exception fetching ${table}: `, error);
      return null;
    }
  }


  // --- Dashboard Data ---

  async getDashboardData() {
    // Import cashflow aggregation
    const { getCashflowAggregation } = await import('./cashflow-api');

    const [executions, history, cashflowAgg, openEscalations] = await Promise.all([
      this.supabaseFetch<Execution[]>('executions', {
        order: { column: 'started_at', ascending: false },
        limit: 1000
      }),
      this.supabaseFetch<WhatsAppHistory[]>('vivilo_whatsapp_history', {
        order: { column: 'id', ascending: false },
        limit: 100
      }),
      getCashflowAggregation(this.organizationId || undefined),
      this.getEscalationsData('OPEN'),
    ]);

    const safeExecutions = executions || [];
    const safeHistory = history || [];
    const safeOpenEscalations = openEscalations || [];

    // Map Execution to ExecutionEvent with 15 essential columns
    const events: ExecutionEvent[] = safeExecutions.map((exec: Execution) => {
      const statusMap: Record<string, AppStatus> = {
        'success': 'Completed',
        'running': 'In Progress',
        'error': 'Failed',
        'waiting': 'Pending',
        'cancelled': 'Failed'
      };

      const formatTime = (seconds?: number) => {
        if (!seconds) return undefined;
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
      };

      return {
        // Core identification (3)
        id: exec.execution_id,
        type: exec.workflow_name || 'Workflow',
        status: statusMap[exec.status?.toLowerCase() || 'pending'] || 'Pending',

        // Execution details (5)
        finished: exec.finished,
        mode: exec.mode,
        started: exec.started_at ? new Date(exec.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        stopped: exec.stopped_at ? new Date(exec.stopped_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        duration: exec.started_at && exec.stopped_at
          ? `${((new Date(exec.stopped_at).getTime() - new Date(exec.started_at).getTime()) / 1000).toFixed(1)}s`
          : undefined,

        // Governance & Quality (4)
        verdict: exec.governance_verdict ? (exec.governance_verdict.toUpperCase() as Verdict) : undefined,
        escalation: exec.human_escalation_triggered || false,
        escalation_priority: exec.escalation_priority || undefined,
        escalation_status: exec.escalation_status || undefined,

        // Business metrics (3) - show actual values when available
        value_captured: exec.value_captured && exec.value_captured > 0 ? exec.value_captured : undefined,
        messages_sent: exec.messages_sent && exec.messages_sent > 0 ? exec.messages_sent : undefined,
        time_saved: exec.time_saved_seconds && exec.time_saved_seconds > 0 ? formatTime(exec.time_saved_seconds) : undefined,

        // Legacy fields
        agent: exec.workflow_name === 'Lara' ? 'Lara-v2' : 'Amelia-v4',
        risk: 'Low'
      };
    });

    // Use cashflow aggregation and accurate escalation count for KPIs
    const kpis = calculateDashboardKPIs(
      safeExecutions,
      safeHistory.length,
      {
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
      } as CashflowSummary,
      safeOpenEscalations.length
    );

    return {
      kpis,
      events, // Dashboard expects 'events' as ExecutionEvent[]
      whatsappHistory: safeHistory,
      cashflow: cashflowAgg,
      openEscalationsCount: safeOpenEscalations.length
    };
  }

  // --- Growth Data ---

  async getGrowthData() {
    // Fetch executions (for future use when workflows are fixed)
    const executions = await this.supabaseFetch<Execution[]>('executions', {
      order: { column: 'created_at', ascending: false },
      limit: 1000,
    });

    // Fetch cashflow transactions as primary data source for Growth KPIs
    const cashflowTransactions = await this.supabaseFetch<CashflowTransaction[]>('cashflow_summary', {
      order: { column: 'created_at', ascending: false },
      limit: 1000,
    });

    // Calculate KPIs using both sources (cashflow is primary while executions is empty)
    const kpis = calculateGrowthKPIs(executions || [], cashflowTransactions || []);

    // Build wins from transactions above €500
    const wins = (cashflowTransactions || [])
      .filter((tx) => {
        const amount = parseCurrency(tx.total_amount);
        return amount >= 500;
      })
      .slice(0, 10)
      .map((tx) => ({
        id: tx.code || tx.id.slice(0, 8),
        title: `${tx.guest} - ${tx.code} `,
        value: tx.total_amount,
        date: tx.collection_date || new Date(tx.created_at).toLocaleDateString(),
        status: 'Captured' as 'Approved' | 'Captured' | 'Verified',
      }));

    const valueCreated = [
      { label: 'Hours Saved', value: '12h' },
      { label: 'Escalations Avoided', value: '3' },
      { label: 'Response Time', value: '< 2min' },
      { label: 'Automation Rate', value: '87%' },
      { label: 'Guest Satisfaction', value: '94%' },
      { label: 'Cost Savings', value: '€ 450,00' },
    ];

    return { kpis, wins, valueCreated };
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
    const url = `${SUPABASE_URL} /rest/v1 / addons ? id = eq.${id}& organization_id=eq.${this.organizationId} `;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY} `,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enabled })
    });

    if (!response.ok) {
      throw new Error(`Failed to update addon: ${response.status} `);
    }
    return response.json();
  }

  async updateIntelligenceMode(mode: string) {
    // Assuming settings table has organization_id column or we update the single row
    const url = `${SUPABASE_URL} /rest/v1 / settings ? organization_id = eq.${this.organizationId} `;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY} `,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ intelligence_mode: mode })
    });

    if (!response.ok) {
      throw new Error(`Failed to update intelligence mode: ${response.status} `);
    }
    return response.json();
  }

  async updateGeneralSettings(settings: {
    tone_of_voice: string;
    languages: string[];
    formality_level: string;
    brand_keywords: string;
  }) {
    const url = `${SUPABASE_URL} /rest/v1 / settings ? organization_id = eq.${this.organizationId} `;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY} `,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings)
    });

    if (!response.ok) {
      throw new Error(`Failed to update general settings: ${response.status} `);
    }
    return response.json();
  }

  async updateEngineStatus(id: string, status: 'Active' | 'Paused') {
    const url = `${SUPABASE_URL} /rest/v1 / engines ? id = eq.${id}& organization_id=eq.${this.organizationId} `;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY} `,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error(`Failed to update engine status: ${response.status} `);
    }
    return response.json();
  }

  // --- Escalations ---

  async getEscalationsData(status?: string): Promise<Escalation[]> {
    // 1. Fetch from 'escalations' (dedicated table), excluding mock data
    const escalationsRes = await this.supabaseFetch<Escalation[]>('escalations', {
      ...(status ? { eq: { status } } : {}),
      order: { column: 'created_at', ascending: false }
    });

    // 2. Fetch from 'executions' (legacy/automatic triggers), excluding mock data
    const executionsRes = await this.supabaseFetch<Execution[]>('executions', {
      eq: {
        human_escalation_triggered: true,
        ...(status ? { escalation_status: status } : {})
      },
      order: { column: 'created_at', ascending: false }
    });

    const unified: Escalation[] = [];

    // Helper to check if execution_id is mock/test data
    const isMockData = (executionId: string | null | undefined): boolean => {
      if (!executionId) return false;
      return executionId.startsWith('hist-') || executionId.startsWith('test-');
    };

    // Process new table records first (these are the source of truth), excluding mock data
    if (escalationsRes) {
      unified.push(...escalationsRes
        .filter(esc => !isMockData(esc.execution_id))
        .map(esc => ({
          ...esc,
          organization_id: esc.organization_id || this.organizationId || ''
        }))
      );
    }

    // Track execution_ids that already have dedicated escalation entries
    const existingExecutionIds = new Set(
      unified
        .map(esc => esc.execution_id)
        .filter((id): id is string => id !== null && id !== undefined)
    );

    // Process legacy table records and map them, excluding mock data and duplicates
    if (executionsRes) {
      const legacyMapped = executionsRes
        .filter(exec => !isMockData(exec.execution_id)) // Exclude mock data
        .filter(exec => exec.escalation_status && exec.escalation_status !== '')
        .filter(exec => !existingExecutionIds.has(exec.execution_id)) // Deduplicate
        .map(exec => {
          const durationMs = exec.stopped_at && exec.started_at
            ? new Date(exec.stopped_at).getTime() - new Date(exec.started_at).getTime()
            : 0;

          // Extract workflow-specific data from JSONB if available
          const workflowData = exec.workflow_output || {};
          const guestPhone = workflowData?.guest?.phone || workflowData?.whatsapp?.contact_name || '';
          const triggerMessage = workflowData?.channel?.message_body || '';

          const escalationData: Escalation = {
            id: exec.execution_id,
            phone_clean: guestPhone,
            execution_id: exec.execution_id,
            status: (exec.escalation_status || 'OPEN') as 'OPEN' | 'RESOLVED' | 'DISMISSED',
            classification: exec.escalation_priority || 'medium',
            resolution_notes: workflowData?.escalation?.resolution_notes,
            resolved_by: workflowData?.escalation?.assigned_to,
            resolved_at: workflowData?.escalation?.resolved_at,
            organization_id: exec.organization_id || '',
            metadata: {
              reason: exec.human_escalation_reason,
              workflow: exec.workflow_name,
              risk_type: workflowData?.risk?.type,
              score: workflowData?.risk?.score,
              response_time_minutes: Math.round(durationMs / 60000),
              trigger_message: triggerMessage,
            },
            created_at: exec.created_at || new Date().toISOString(),
            updated_at: exec.updated_at || exec.created_at || new Date().toISOString(),
          };
          return escalationData;
        });
      unified.push(...legacyMapped);
    }

    // Sort combined results by created_at descending
    return unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getEscalationContext(identifier: string) {
    // Helper to find context. Identifier might be phone number or execution ID.
    // We search whatsapp history primarily by matching phone numbers.
    let phone = identifier;

    // If identifier looks like an execution ID (UUID ish) or small ID, we might need to look up the execution first
    // But typically the frontend passes 'phone_clean'.

    // Clean phone for search (remove non-digits if necessary, but Supabase usually stores exact matches)
    // Here we query vivilo_whatsapp_history. 
    // Note: vivilo_whatsapp_history doesn't always have a clear phone column, it relies on session_id or 'message' data.
    // However, our Types indicate it has 'session_id'. 
    // Let's rely on api fetch limit for now.

    // For now, simpler approach: just fetch recent history. 
    // Ideally we filter by session_id = phone number (if session_id is phone)

    const history = await this.supabaseFetch<WhatsAppHistory[]>('vivilo_whatsapp_history', {
      // If session_id is the phone number, use that
      eq: { session_id: phone },
      order: { column: 'created_at', ascending: false },
      limit: 20
    });

    return { history: history || [] };
  }

  async resolveEscalation(
    id: string,
    notes: string,
    classification: string,
    userId?: string,
    userName?: string
  ) {
    // Determine if the ID is a UUID (likely 'escalations' table) or a number string (likely 'executions' table)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const table = isUuid ? 'escalations' : 'executions';

    const updates = isUuid ? {
      status: 'RESOLVED',
      resolution_notes: notes,
      classification: classification,
      resolved_by: userId,
      resolved_by_name: userName,
      resolved_at: new Date().toISOString(),
    } : {
      escalation_status: 'RESOLVED',
      escalation_resolution_notes: notes,
      escalation_priority: classification,
      escalation_assigned_to: userId,
      escalation_resolved_by_name: userName,
      escalation_resolved_at: new Date().toISOString(),
    };

    return this.updateEscalation(id, updates, table);
  }

  async updateEscalation(id: string, updates: any, table: 'executions' | 'escalations' = 'executions') {
    const url = `${SUPABASE_URL} /rest/v1 / ${table}?id = eq.${id}& organization_id=eq.${this.organizationId} `;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY} `,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        ...updates,
        updated_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update ${table}: ${response.status} `);
    }

    return response.json();
  }

  async getTeamMembers() {
    // Fetch members joined with profiles
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
id,
  user_id,
  role,
  created_at,
  profiles(
    full_name,
    email,
    phone
  )
    `)
      .eq('organization_id', this.organizationId);

    if (error) throw error;
    return data;
  }

  async createSubAccount(email: string, password: string, fullName: string, role: string = 'viewer') {
    // Note: Creating accounts usually requires administrative privileges or a backend trigger/Edge Function.
    // For this context, we'll try standard signUp. 
    // IMPORTANT: In production, use Supabase Auth Admin via an Edge Function to avoid signing the current admin out.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (authError) throw authError;

    // Link to organization
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        user_id: authData.user?.id,
        organization_id: this.organizationId,
        role
      });

    if (memberError) throw memberError;
    return { success: true };
  }

  async updateAutoTopup(enabled: boolean, threshold: number, amount: number) {
    const url = `${SUPABASE_URL} /rest/v1 / organization_entitlements ? organization_id = eq.${this.organizationId} `;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY} `,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auto_topup_enabled: enabled,
        auto_topup_threshold: threshold,
        auto_topup_amount: amount
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to update auto top - up: ${response.status} `);
    }
    return response.json();
  }

  // --- Message Log ---

  async getConversationsData() {
    // Get the LATEST 1000 messages (ordered by ID desc to ensure we get newest)
    const history = await this.supabaseFetch<WhatsAppHistory[]>('vivilo_whatsapp_history', {
      order: { column: 'id', ascending: false },
      limit: 1000
    });

    // Reverse history to process chronologically for grouping
    const safeHistory = (history || []).reverse();

    // Filter out tool messages and AI internal traces using the shared cleaning rule
    const userMessages = safeHistory.filter(msg => {
      if (msg.message.type === 'tool') return false;

      const cleaned = cleanMessageContent(msg.message.content);
      // If cleaning removes everything (like internal traces), filter it out
      if (!cleaned && msg.message.type === 'ai') return false;

      return msg.message.type === 'human' || msg.message.type === 'ai';
    });

    // Group by session_id into conversations
    const conversationsMap = new Map<string, Conversation & { latestTimestamp: number }>();

    userMessages.forEach(msg => {
      const sessionId = msg.session_id;
      const msgTimestamp = msg.id;
      const msgDate = new Date(msg.created_at);
      const isToday = msgDate.toDateString() === new Date().toDateString();

      // Formatting: Show date if not today
      const messageTime = isToday
        ? msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : msgDate.toLocaleDateString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

      if (!conversationsMap.has(sessionId)) {
        conversationsMap.set(sessionId, {
          id: sessionId,
          name: sessionId,
          initials: sessionId.slice(0, 2),
          platform: 'whatsapp',
          time: messageTime,
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
          latestTimestamp: msgTimestamp,
          latestMessageAt: msg.created_at
        });
      }

      const conv = conversationsMap.get(sessionId)!;

      // Update latest metadata
      if (msgTimestamp > conv.latestTimestamp) {
        conv.latestTimestamp = msgTimestamp;
        conv.time = messageTime;
        conv.latestMessageAt = msg.created_at;
      }

      conv.messages.push({
        id: String(msg.id),
        sender: msg.message.type === 'human' ? 'guest' : 'agent',
        type: 'text',
        text: cleanMessageContent(msg.message.content || ''),
        time: messageTime
      });
    });

    // Convert to array and sort by latest message ISO string (most recent first)
    const conversations = Array.from(conversationsMap.values())
      .sort((a, b) => new Date(b.latestMessageAt).getTime() - new Date(a.latestMessageAt).getTime())
      .map(({ latestTimestamp, ...conv }) => conv);

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
      order: { column: 'created_at', ascending: false }
    });

    if (!data || data.length === 0) return null;

    // Calculate aggregates on the fly since DB is transactional
    const total_revenue = data.reduce((acc, curr) => acc + (parseFloat(curr.total_amount) || 0), 0);
    const executions_count = data.length;

    // Return the latest record merged with calculated aggregates
    return {
      ...data[0],
      total_revenue,
      executions_count,
      currency: 'EUR'
    } as CashflowSummary;
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
