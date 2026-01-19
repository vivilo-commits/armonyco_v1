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
  RiskLevel
} from './types';
import { calculateDashboardKPIs, calculateGrowthKPIs } from './utils';

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
   * Direct fetch with timeout and error handling
   * Using native fetch to bypass Supabase JS client timeout issues
   */
  private async directFetch<T>(
    table: string,
    params: Record<string, string> = {}
  ): Promise<T | null> {
    const defaultParams = {
      select: '*',
    };

    const finalParams: Record<string, string> = { ...defaultParams, ...params };

    // Add organization_id filter if present and not explicitly fetching all
    if (this.organizationId && !params.organization_id) {
      finalParams['organization_id'] = `eq.${this.organizationId}`;
    }

    const queryString = new URLSearchParams(finalParams).toString();
    const url = `${SUPABASE_URL}/rest/v1/${table}?${queryString}`;

    try {
      console.log(`[API] 🔄 Fetching ${table}...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));

      if (!response.ok) {
        console.error(`[API] ❌ HTTP ${response.status} for ${table}`);
        return null;
      }

      const data = await response.json();
      console.log(`[API] ✅ ${table}: ${Array.isArray(data) ? data.length : 1} rows`);
      return data as T;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`[API] ⏱️ Timeout fetching ${table}`);
      } else {
        console.error(`[API] ❌ Error fetching ${table}:`, error);
      }
      return null;
    }
  }

  // --- Dashboard Data ---

  async getDashboardData() {
    const [executions, history] = await Promise.all([
      this.directFetch<Execution[]>('executions', { order: 'started_at.desc', limit: '50' }),
      this.directFetch<WhatsAppHistory[]>('vivilo_whatsapp_history', { limit: '100' }),
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

    // Use original calculation logic for 12 KPIs
    const kpis = calculateDashboardKPIs(safeExecutions, safeHistory.length);

    return {
      kpis,
      events, // Dashboard expects 'events' as ExecutionEvent[]
      whatsappHistory: safeHistory,
    };
  }

  // --- Growth Data ---

  async getGrowthData() {
    const executions = await this.directFetch<Execution[]>('executions', { limit: '1000' });
    const safeExecutions = executions || [];
    const kpis = calculateGrowthKPIs(safeExecutions);

    return {
      kpis,
      wins: safeExecutions
        .filter(e => (e.value_captured || 0) > 0)
        .map(e => ({
          id: String(e.execution_id || e.id),
          title: `${e.workflow_name} - ${e.guest_name || 'Guest'}`,
          value: `€ ${e.value_captured?.toFixed(2) || '0,00'}`,
          date: e.started_at || e.created_at || new Date().toISOString(),
          status: 'Captured' as 'Approved' | 'Captured' | 'Verified'
        })),
    };
  }

  // --- Controls Data ---

  async getControlsData() {
    const [engines, addons, settings] = await Promise.all([
      this.directFetch<ControlEngine[]>('engines'),
      this.directFetch<ControlAddon[]>('addons'),
      this.directFetch<any[]>('settings', { limit: '1' }),
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

  // --- Escalations ---

  async getEscalationsData(status?: string) {
    const params: Record<string, string> = {
      order: 'created_at.desc',
    };

    if (status) {
      params['status'] = `eq.${status}`;
    }

    const data = await this.directFetch<Escalation[]>('escalations', params);
    return data || [];
  }

  async getEscalationContext(_phone: string) {
    const history = await this.directFetch<WhatsAppHistory[]>('vivilo_whatsapp_history', {
      order: 'created_at.desc',
      limit: '20'
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

  // --- Message Log ---

  async getConversationsData() {
    const history = await this.directFetch<WhatsAppHistory[]>('vivilo_whatsapp_history', {
      order: 'created_at.desc',
      limit: '500'
    });

    const safeHistory = history || [];

    // Group by session_id into conversations
    const conversationsMap = new Map<string, Conversation>();

    safeHistory.forEach(msg => {
      const sessionId = msg.session_id;
      if (!conversationsMap.has(sessionId)) {
        conversationsMap.set(sessionId, {
          id: sessionId,
          name: 'Guest',
          initials: 'G',
          platform: 'whatsapp',
          time: msg.created_at || msg.timestamp || new Date().toISOString(),
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
          }
        });
      }

      const conv = conversationsMap.get(sessionId)!;
      conv.messages.push({
        id: String(msg.id),
        sender: msg.direction === 'inbound' ? 'guest' : 'agent',
        type: 'text',
        text: msg.message?.body || '',
        time: msg.created_at || msg.timestamp
      });
    });

    return {
      conversations: Array.from(conversationsMap.values()),
    };
  }

  // --- Settings ---

  async getSettingsData() {
    const settings = await this.directFetch<any[]>('settings', { limit: '1' });
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
