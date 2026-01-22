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
import {
  calculateDashboardKPIs,
  calculateGrowthKPIs,
  normalizePriority,
  normalizeRiskLevel,
  cleanMessageContent,
  normalizePhone,
  parseCurrency,
  formatCurrency
} from './utils';
import { CashflowTransaction } from './cashflow-api';
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
      filter?: { column: string; value: any }; // Added for getEscalationContext
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
          // [DIAGNOSTIC] Temporarily skip filter for escalations to debug disappearance
          // But actually, we SHOULD keep it for security. 
          // I will ONLY skip it if it's the specific cause.
          // Let's bring it back and fix the logical error in merging.
          query = query.eq('organization_id', this.organizationId);
        }
      }

      // Apply other filters
      if (options.eq) {
        Object.entries(options.eq).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Apply single filter (for getEscalationContext)
      if (options.filter) {
        query = query.eq(options.filter.column, options.filter.value);
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
        escalation: exec.human_escalation_triggered || !!(exec.escalation_status || exec.escalation_priority || exec.human_escalation_reason),
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
    // Filter by organization_id for accurate count
    let messageQuery = supabase
      .from('vivilo_whatsapp_history')
      .select('*', { count: 'exact', head: true });

    if (this.organizationId) {
      messageQuery = messageQuery.eq('organization_id', this.organizationId);
    }

    const { count: trueMessageCount } = await messageQuery;

    const kpis = calculateDashboardKPIs(
      safeExecutions,
      trueMessageCount ?? 0,
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

    // Calculate escalation metrics from executions.escalation_status (NOT escalations table which is empty)
    const safeExecutions = executions || [];
    const executionsWithHumanIntervention = safeExecutions.filter(e =>
      e.human_escalation_triggered === true
    );
    const resolvedEscalations = executionsWithHumanIntervention.filter(e =>
      e.escalation_status === 'RESOLVED'
    );
    const openEscalations = executionsWithHumanIntervention.filter(e =>
      e.escalation_status !== 'RESOLVED'
    );

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
        title: `${tx.guest} - ${tx.code}`,
        value: tx.total_amount,
        date: tx.collection_date || new Date(tx.created_at).toLocaleDateString(),
        status: 'Captured' as 'Approved' | 'Captured' | 'Verified',
      }));

    const totalHoursSaved = safeExecutions.reduce((sum, e) => sum + (e.time_saved_seconds || 0), 0) / 3600;

    // Automation Rate: (executions without escalation) / total executions
    const automationRate = safeExecutions.length > 0
      ? Math.round((safeExecutions.filter(e => !e.human_escalation_triggered).length / safeExecutions.length) * 100)
      : 0;

    const valueCreated = [
      { label: 'Hours Saved', value: `${totalHoursSaved.toFixed(1)}h` },
      { label: 'Escalations Resolved', value: String(resolvedEscalations.length) },
      { label: 'Escalations Open', value: String(openEscalations.length) },
      { label: 'Automation Rate', value: `${automationRate}%` },
      { label: 'Total Escalations', value: String(executionsWithHumanIntervention.length) },
      { label: 'Resolution Rate', value: executionsWithHumanIntervention.length > 0 ? `${Math.round((resolvedEscalations.length / executionsWithHumanIntervention.length) * 100)}%` : '0%' },
    ];

    // Add escalation summary
    const escalationSummary = {
      total: executionsWithHumanIntervention.length,
      open: openEscalations.length,
      resolved: resolvedEscalations.length,
      resolutionRate: executionsWithHumanIntervention.length > 0 ? Math.round((resolvedEscalations.length / executionsWithHumanIntervention.length) * 100) : 0,
      recentResolutions: resolvedEscalations.slice(0, 5).map(e => ({
        id: e.execution_id,
        phone: e.workflow_output?.phone || '',
        reason: e.human_escalation_reason || '',
        resolvedAt: e.updated_at,
        resolvedBy: e.workflow_output?.resolved_by || '',
      })),
    };

    return { kpis, wins, valueCreated, escalationSummary };
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

  /**
   * Safely parse workflow_output, handling potential double-stringification
   */
  private robustParseOutput(rawOutput: any): any {
    if (!rawOutput) return {};
    let data = rawOutput;
    try {
      if (typeof data === 'string') {
        data = JSON.parse(data);
        // Sometimes it's double stringified from certain n8n versions
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }
      }
    } catch (e) {
      console.warn('[API] Failed to parse workflow_output:', e);
      return {};
    }
    return data || {};
  }

  // --- Escalations ---

  async getEscalationsData(status?: string): Promise<Escalation[]> {
    console.log('[API] 📋 getEscalationsData called with status:', status);

    // 1. Fetch from 'escalations' (dedicated table) - PRIMARY SOURCE
    const escalationsRes = await this.supabaseFetch<Escalation[]>('escalations', {
      order: { column: 'created_at', ascending: false }
    });
    console.log('[API] 📋 Escalations table returned:', escalationsRes?.length || 0, 'records');

    // 2. Fetch from 'executions' - SECONDARY SOURCE for detection
    const allExecutions = await this.supabaseFetch<Execution[]>('executions', {
      order: { column: 'created_at', ascending: false },
      limit: 500
    });
    console.log('[API] 📋 Executions table returned:', allExecutions?.length || 0, 'records');

    const isMock = (id?: string) => id?.startsWith('hist-') || id?.startsWith('test-');

    // Detect escalations from executions
    // STRICT: Only count as escalation if human_escalation_triggered is EXPLICITLY true
    // This prevents false positives and differentiates from Growth page metrics:
    // - Growth counts all escalation_status (risk situations)
    // - Escalations page counts only human interventions (human_escalation_triggered = true)
    const mappedExecutions: Escalation[] = (allExecutions || [])
      .filter(exec => {
        // Skip mock/test data
        if (isMock(exec.execution_id) || isMock(exec.workflow_name)) return false;

        const workflowData = this.robustParseOutput(exec.workflow_output);

        // Only check if human_escalation_triggered is true
        // Don't require a meaningful reason - empty reasons should still show up for resolution
        const isExplicitlyTriggered =
          exec.human_escalation_triggered === true ||
          workflowData?.human_escalation_triggered === true;

        if (isExplicitlyTriggered) {
          console.log('[API] 📋 Found human intervention:', exec.execution_id);
        }

        return isExplicitlyTriggered;
      })
      .map(exec => {
        const workflowData = this.robustParseOutput(exec.workflow_output);

        const sessionId = workflowData?.channel?.conversation_id ||
          workflowData?.guest?.session_id ||
          workflowData?.session_id || '';

        const messageId = workflowData?.channel?.message_id ||
          workflowData?.message_id || '';

        const aiOutput = workflowData?.ai_output || workflowData?.message || '';

        // Extract trigger message from multiple possible locations in workflow_output
        // Priority: explicit trigger_message > last_message > ai response > guest message
        const triggerMessage =
          workflowData?.trigger_message ||
          workflowData?.escalation?.trigger_message ||
          workflowData?.last_message ||
          workflowData?.last_human_message ||
          workflowData?.guest_message ||
          workflowData?.channel?.last_message ||
          workflowData?.ai?.response_preview ||
          workflowData?.human_escalation_reason ||
          exec.human_escalation_reason ||
          '';

        // Extract phone from multiple possible locations
        const safePhone = workflowData?.guest?.phone ||
          workflowData?.phone ||
          workflowData?.channel?.phone ||
          sessionId ||
          '';
        const phoneClean = typeof safePhone === 'string' ? normalizePhone(safePhone) : '';

        // Determine status from multiple sources
        const resolvedStatus = (
          exec.escalation_status?.toUpperCase() === 'RESOLVED' ||
          workflowData?.escalation_status?.toUpperCase() === 'RESOLVED'
        ) ? 'RESOLVED' : 'OPEN';

        // Extract resolved_by_name from human_escalation_reason if present
        // Format: "[RESOLVED by NAME] notes" or "[RESOLVED by NAME]"
        let resolvedByName: string | undefined;
        const reasonText = exec.human_escalation_reason || '';
        const resolvedMatch = reasonText.match(/\[RESOLVED by ([^\]]+)\]/i);
        if (resolvedMatch) {
          resolvedByName = resolvedMatch[1].trim();
        }

        return {
          id: exec.execution_id || 'unknown',
          phone_clean: phoneClean || sessionId || exec.execution_id, // Prefer session_id over execution_id
          execution_id: exec.execution_id,
          status: resolvedStatus as 'OPEN' | 'RESOLVED' | 'DISMISSED',
          priority: normalizePriority(exec.escalation_priority || workflowData?.escalation?.priority || 'LOW'),
          classification: normalizePriority(exec.escalation_priority || workflowData?.escalation?.priority || 'M1'),
          reason: exec.human_escalation_reason || workflowData?.human_escalation_reason || workflowData?.escalation?.reason || 'Human interaction requested',
          resolved_by_name: resolvedByName,
          resolved_at: resolvedStatus === 'RESOLVED' ? exec.updated_at : undefined,
          organization_id: exec.organization_id || this.organizationId || '',
          created_at: exec.created_at || new Date().toISOString(),
          updated_at: exec.updated_at || new Date().toISOString(),
          metadata: {
            message_id: messageId,
            session_id: sessionId,
            ai_output: aiOutput,
            trigger_message: triggerMessage,
            workflow: exec.workflow_name || 'System',
            risk_type: normalizeRiskLevel(workflowData?.risk?.type),
            score: workflowData?.risk?.score || 0,
            reason: exec.human_escalation_reason || workflowData?.human_escalation_reason || workflowData?.escalation?.reason,
            resolved_by_name: resolvedByName,
          }
        };
      });

    console.log('[API] 📋 Mapped executions with escalation triggers:', mappedExecutions.length);

    // Build unified map with de-duplication
    const unifiedMap = new Map<string, Escalation>();

    // 1. Load from escalations table first (PRIMARY - has persistence status)
    (escalationsRes || []).forEach(e => {
      const sid = e.phone_clean || e.metadata?.session_id || e.id;
      unifiedMap.set(sid, e);
    });

    // 2. Merge from executions (only add if not already in escalations table)
    mappedExecutions.forEach(e => {
      const sid = (e.phone_clean && e.phone_clean.length > 3)
        ? e.phone_clean
        : (e.metadata?.session_id || e.id);

      const existing = unifiedMap.get(sid);

      if (!existing) {
        // New escalation detected from execution
        unifiedMap.set(sid, e);
      } else {
        // Escalation already exists - keep the persisted status, but update metadata if execution is newer
        const existingDate = new Date(existing.created_at).getTime();
        const detectedDate = new Date(e.created_at).getTime();
        if (detectedDate > existingDate) {
          unifiedMap.set(sid, {
            ...e,
            id: existing.id, // Keep original ID for updates
            status: existing.status, // Keep persisted status
          });
        }
      }
    });

    const unified = Array.from(unifiedMap.values());
    console.log('[API] 📋 Unified escalations before filtering:', unified.length);

    // Filter by status if requested
    const filtered = status && status !== 'ALL'
      ? unified.filter(e => e.status === status.toUpperCase())
      : unified;

    console.log('[API] 📋 Final filtered escalations:', filtered.length, 'for status:', status);

    // Sort by newest first
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return filtered;
  }

  async getEscalationContext(identifier?: string, aiOutput?: string) {
    console.log('[API] 📱 getEscalationContext called with:', { identifier, aiOutputLength: aiOutput?.length });

    if (!identifier && !aiOutput) {
      console.log('[API] ⚠️ No identifier or aiOutput provided');
      return { history: [] };
    }

    // 1. Try direct identifier match (phone/session_id) - try both raw and normalized
    if (identifier) {
      const cleanId = normalizePhone(identifier);
      console.log('[API] 📱 Trying identifier:', identifier, '-> cleaned:', cleanId);

      // Try with cleaned ID first
      if (cleanId) {
        const history = await this.supabaseFetch<WhatsAppHistory[]>('vivilo_whatsapp_history', {
          filter: { column: 'session_id', value: cleanId },
          order: { column: 'id', ascending: true },
          limit: 100
        });
        console.log('[API] 📱 Query with cleanId returned:', history?.length || 0, 'messages');

        if (history && history.length > 0) return { history };
      }

      // Try with raw identifier (in case it's already in the correct format)
      if (identifier !== cleanId) {
        const history = await this.supabaseFetch<WhatsAppHistory[]>('vivilo_whatsapp_history', {
          filter: { column: 'session_id', value: identifier },
          order: { column: 'id', ascending: true },
          limit: 100
        });
        console.log('[API] 📱 Query with raw identifier returned:', history?.length || 0, 'messages');

        if (history && history.length > 0) return { history };
      }

      // Try partial match using ILIKE
      const { data: partialMatch } = await supabase
        .from('vivilo_whatsapp_history')
        .select('*')
        .ilike('session_id', `%${cleanId || identifier}%`)
        .order('id', { ascending: true })
        .limit(100);

      console.log('[API] 📱 Partial match query returned:', partialMatch?.length || 0, 'messages');
      if (partialMatch && partialMatch.length > 0) return { history: partialMatch };
    }

    // 2. Fallback: Search by AI Output content if identifier failed or missing
    // This is the "Healing Engine" logic
    if (aiOutput && aiOutput.length > 10) {
      console.log(`[API] 🩹 Healing linkage: Searching history for content match: "${aiOutput.slice(0, 50)}..."`);

      // Search for the content in message
      const { data } = await supabase
        .from('vivilo_whatsapp_history')
        .select('*')
        .ilike('message->>content', `%${aiOutput.slice(0, 50)}%`)
        .order('id', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const foundSessionId = data[0].session_id;
        console.log(`[API] ✅ Linkage healed! Found session_id: ${foundSessionId}`);
        const fullHistory = await this.supabaseFetch<WhatsAppHistory[]>('vivilo_whatsapp_history', {
          filter: { column: 'session_id', value: foundSessionId },
          order: { column: 'id', ascending: true },
          limit: 100
        });
        return { history: fullHistory || [] };
      }
    }

    console.log('[API] ⚠️ No history found for this escalation');
    return { history: [] };
  }

  async resolveEscalation(
    id: string,
    notes: string,
    classification: string,
    userId?: string,
    userName?: string,
    escalationData?: {
      phone_clean?: string;
      reason?: string;
      workflow?: string;
      trigger_message?: string;
    }
  ) {
    // Determine if the ID is a UUID (likely 'escalations' table) or a number string (likely 'executions' table)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const isFromExecutions = !isUuid;

    const resolvedAt = new Date().toISOString();

    // 1. If from executions table, update it
    if (isFromExecutions) {
      await this.updateEscalation(id, {
        escalation_status: 'RESOLVED',
        escalation_priority: classification,
        human_escalation_reason: notes ? `[RESOLVED by ${userName || 'operator'}] ${notes}` : undefined,
      }, 'executions');
    }

    // 2. Always persist to escalations table
    const phoneClean = escalationData?.phone_clean || id;
    const orgId = this.organizationId;

    console.log('[API] resolveEscalation - Persisting to escalations table:', {
      phoneClean,
      orgId,
      userId,
      userName,
      hasEscalationData: !!escalationData
    });

    // Skip if no organization_id
    if (!orgId) {
      console.error('[API] Cannot persist escalation: organization_id is null');
      return { success: true }; // Still return success for the executions update
    }

    // First check if escalation already exists for this phone/org
    const { data: existing, error: selectError } = await supabase
      .from('escalations')
      .select('id')
      .eq('phone_clean', phoneClean)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (selectError) {
      console.error('[API] Error checking existing escalation:', selectError);
    }

    const escalationRecord = {
      execution_id: isFromExecutions ? id : phoneClean,
      phone_clean: phoneClean,
      status: 'RESOLVED' as const,
      priority: classification || 'M1',
      reason: escalationData?.reason || notes || 'Resolved via UI',
      resolution_notes: notes || '',
      resolved_by: userId || null,
      resolved_by_name: userName || 'System',
      resolved_at: resolvedAt,
      organization_id: orgId,
      metadata: {
        workflow: escalationData?.workflow || 'System',
        trigger_message: escalationData?.trigger_message || '',
        resolved_by_name: userName || 'System',
      },
      updated_at: resolvedAt,
    };

    console.log('[API] Escalation record to persist:', escalationRecord);

    if (existing?.id) {
      // Update existing record
      console.log('[API] Updating existing escalation:', existing.id);
      const { error: updateError } = await supabase
        .from('escalations')
        .update(escalationRecord)
        .eq('id', existing.id);

      if (updateError) {
        console.error('[API] Failed to update escalation record:', JSON.stringify(updateError));
      } else {
        console.log('[API] Successfully updated escalation in Supabase');
      }
    } else {
      // Insert new record
      console.log('[API] Inserting new escalation record for:', phoneClean);
      const { data: insertData, error: insertError } = await supabase
        .from('escalations')
        .insert({
          ...escalationRecord,
          created_at: resolvedAt,
        })
        .select();

      if (insertError) {
        console.error('[API] Failed to insert escalation record:', JSON.stringify(insertError));
        console.error('[API] Insert error details:', insertError.message, insertError.details, insertError.hint);
      } else {
        console.log('[API] Successfully inserted escalation to Supabase:', insertData);
      }
    }

    // 3. If originally from escalations table, also update it directly
    if (!isFromExecutions) {
      await this.updateEscalation(id, {
        status: 'RESOLVED',
        resolution_notes: notes,
        priority: classification,
        resolved_by: userId,
        resolved_by_name: userName,
        resolved_at: resolvedAt,
      }, 'escalations');
    }

    return { success: true };
  }

  async reopenEscalation(id: string) {
    console.log('[API] 🔓 Reopening escalation:', id);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const isFromExecutions = !isUuid;

    const updates = {
      status: 'OPEN',
      resolved_at: null,
      resolved_by: null,
      resolved_by_name: null,
      resolution_notes: null,
    };

    if (isFromExecutions) {
      // Update executions table
      await this.updateEscalation(id, {
        escalation_status: 'OPEN',
      }, 'executions');
    }

    // Update escalations table
    const { data: existing } = await supabase
      .from('escalations')
      .select('id')
      .or(`execution_id.eq.${id},id.eq.${id}`)
      .maybeSingle();

    if (existing?.id) {
      await this.updateEscalation(existing.id, updates, 'escalations');
    }

    return { success: true };
  }

  /**
   * Manually insert a resolved escalation to Supabase
   * Use this to backfill escalations that weren't persisted
   */
  async insertResolvedEscalation(data: {
    phone_clean: string;
    execution_id?: string;
    reason: string;
    resolution_notes: string;
    resolved_by_name: string;
    resolved_at?: string;
    workflow?: string;
  }) {
    const orgId = this.organizationId;
    if (!orgId) {
      console.error('[API] Cannot insert escalation: organization_id is null');
      return { success: false, error: 'No organization_id' };
    }

    const now = data.resolved_at || new Date().toISOString();

    const record = {
      phone_clean: data.phone_clean,
      execution_id: data.execution_id || data.phone_clean,
      status: 'RESOLVED' as const,
      priority: 'M1',
      reason: data.reason,
      resolution_notes: data.resolution_notes,
      resolved_by: null,
      resolved_by_name: data.resolved_by_name,
      resolved_at: now,
      organization_id: orgId,
      metadata: {
        workflow: data.workflow || 'System',
        resolved_by_name: data.resolved_by_name,
        manually_inserted: true,
      },
      created_at: now,
      updated_at: now,
    };

    console.log('[API] Manually inserting escalation:', record);

    const { data: insertData, error } = await supabase
      .from('escalations')
      .insert(record)
      .select();

    if (error) {
      console.error('[API] Failed to insert escalation:', JSON.stringify(error));
      return { success: false, error: error.message };
    }

    console.log('[API] Successfully inserted escalation:', insertData);
    return { success: true, data: insertData };
  }

  async updateEscalation(id: string, updates: any, table: 'executions' | 'escalations' = 'executions') {
    // Use correct primary key column for each table
    const idColumn = table === 'executions' ? 'execution_id' : 'id';
    const url = `${SUPABASE_URL}/rest/v1/${table}?${idColumn}=eq.${id}&organization_id=eq.${this.organizationId}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        ...updates,
        updated_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Update ${table} failed:`, response.status, errorText);
      throw new Error(`Failed to update ${table}: ${response.status}`);
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
    // Use Edge Function for secure user creation
    // Benefits: bypasses rate limits, auto-confirms email, doesn't log out current user
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('You must be logged in to create team members');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-team-member`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
        role,
        organization_id: this.organizationId
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to create team member');
    }

    return result;
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
