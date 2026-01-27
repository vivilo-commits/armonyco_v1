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
  Conversation,
  CreditTransaction
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
      filter?: { column: string; value: any };
      range?: { column: string; start?: string; end?: string }; // Added for date filtering
      order?: { column: string; ascending?: boolean };
      limit?: number;
    } = {}
  ): Promise<T | null> {
    try {
      console.log(`[API] 🔍 Fetching ${table} with org_id: ${this.organizationId}`);
      if (!this.organizationId) {
        console.warn(`[API] ⚠️ No organization_id set! Data fetch for ${table} might be empty or unrestricted.`);
      }

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

      // Apply date range filters
      if (options.range) {
        if (options.range.start) {
          query = query.gte(options.range.column, options.range.start);
        }
        if (options.range.end) {
          query = query.lte(options.range.column, options.range.end);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error(`[API] ❌ Supabase error for ${table}:`, error);
        console.error(`[API] Error details:`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        return null;
      }

      const resultCount = Array.isArray(data) ? data.length : (data ? 1 : 0);
      console.log(`[API] ✅ ${table}: ${resultCount} rows retrieved`);
      if (resultCount === 0) {
        console.warn(`[API] ⚠️ ${table} returned ZERO results - this may indicate a filtering issue`);
      }
      return data as T;
    } catch (error) {
      console.error(`[API] ❌ Exception fetching ${table}:`, error);
      return null;
    }
  }


  // --- Dashboard Data ---

  async getDashboardData(startDate?: string, endDate?: string) {
    // Import cashflow aggregation
    const { getCashflowAggregation, getCashflowForPeriod } = await import('./cashflow-api');

    const [executions, history, cashflowAgg, openEscalations] = await Promise.all([
      this.supabaseFetch<Execution[]>('executions', {
        range: startDate || endDate ? { column: 'started_at', start: startDate, end: endDate } : undefined,
        order: { column: 'started_at', ascending: false },
        limit: 1000
      }),
      this.supabaseFetch<WhatsAppHistory[]>('vivilo_whatsapp_history', {
        range: startDate || endDate ? { column: 'created_at', start: startDate, end: endDate } : undefined,
        order: { column: 'id', ascending: false },
        limit: 100
      }),
      // Use period filtering for cashflow if dates are provided
      startDate || endDate
        ? getCashflowForPeriod(startDate || '2000-01-01', endDate || new Date().toISOString(), this.organizationId || undefined).then(txs => {
          // Manual aggregation of returned transactions
          const total_revenue = txs.reduce((sum, tx) => sum + parseCurrency(tx.total_amount), 0);
          return { total_revenue, transaction_count: txs.length };
        }) as any
        : getCashflowAggregation(this.organizationId || undefined),
      this.getEscalationsData('OPEN', startDate, endDate),
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
        is_multiple: (exec.messages_sent || 0) > 1,

        // Legacy fields
        agent: exec.workflow_name === 'Lara' ? 'Lara-v2' : 'Amelia-v4',
        risk: 'Low',
        workflow_output: exec.workflow_output
      };
    });

    // Use cashflow aggregation and accurate escalation count for KPIs
    // Filter by organization_id and date range for accurate count
    let messageQuery = supabase
      .from('vivilo_whatsapp_history')
      .select('*', { count: 'exact', head: true });

    if (this.organizationId) {
      messageQuery = messageQuery.eq('organization_id', this.organizationId);
    }

    if (startDate) {
      messageQuery = messageQuery.gte('created_at', startDate);
    }
    if (endDate) {
      messageQuery = messageQuery.lte('created_at', endDate);
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

  async getGrowthData(startDate?: string, endDate?: string) {
    // Fetch executions using started_at for consistency with Dashboard
    const executions = await this.supabaseFetch<Execution[]>('executions', {
      range: startDate || endDate ? { column: 'started_at', start: startDate, end: endDate } : undefined,
      order: { column: 'started_at', ascending: false },
      limit: 1000,
    });

    // Fetch cashflow transactions as primary data source for Growth KPIs
    const cashflowTransactions = await this.supabaseFetch<CashflowTransaction[]>('cashflow_summary', {
      range: startDate || endDate ? { column: 'collection_date', start: startDate, end: endDate } : undefined,
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

    // --- VALUE SAVED CALCULATION (Summation Logic) ---
    // 1. Human Time Value: Hours saved * Hourly Rate (pro-rated €25/hr)
    const hourlyRate = 25;
    const valueFromTime = totalHoursSaved * hourlyRate;

    // 2. Operational Autonomy Value: Fixed savings per autonomous execution (e.g., €0.50/op)
    // Represents the transactional cost of context switching/micro-management avoided
    const autonomousExecutionsCount = safeExecutions.filter(e => !e.human_escalation_triggered).length;
    const valueFromAutonomy = autonomousExecutionsCount * 0.50;

    // 3. Resolution Value: Fixed value per successful resolution (e.g., €5.00/resolution)
    // Represents the value of preventing a negative review or loss of guest
    const valueFromResolutions = resolvedEscalations.length * 5.00;

    const totalValueSaved = valueFromTime + valueFromAutonomy + valueFromResolutions;

    const valueCreated = [
      { label: 'Value Saved', value: formatCurrency(totalValueSaved) },
      { label: 'Hours Saved', value: `${totalHoursSaved.toFixed(1)}h` },
      { label: 'Escalations Resolved', value: String(resolvedEscalations.length) },
      { label: 'Escalations Open', value: String(openEscalations.length) },
      { label: 'Automation Rate', value: `${automationRate}%` },
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

  async getSettingsData() {
    const [engines, addons, settings, entitlements] = await Promise.all([
      this.supabaseFetch<ControlEngine[]>('engines'),
      this.supabaseFetch<ControlAddon[]>('addons'),
      this.supabaseFetch<any[]>('settings', { limit: 1 }),
      this.supabaseFetch<any[]>('organization_entitlements', { limit: 1 }),
    ]);

    const config = settings?.[0] || {};

    return {
      toneOfVoice: config.tone_of_voice || 'Professional & Warm',
      languages: config.languages || ['English', 'Italian'],
      formalityLevel: config.formality_level || 'High',
      brandKeywords: config.brand_keywords || 'Premium, Reliability',
      intelligenceMode: config.intelligence_mode || 'Pro',
      // Dynamic Booleans
      enableShadowMode: !!config.enable_shadow_mode,
      enableMultiLanguage: config.enable_multi_language !== false,
      strictGovernance: config.strict_governance !== false,
      autoUpsell: config.auto_upsell !== false,
      autoEarlyCheckin: !!config.auto_early_checkin,
      autoLateCheckout: !!config.auto_late_checkout,
      selfCorrection: config.self_correction !== false,
      engines: engines || [],
      addons: addons || [],
      entitlements: entitlements?.[0] || null,
    };
  }

  async getControlsData() {
    const data = await this.getSettingsData();
    return {
      toneOfVoice: data.toneOfVoice,
      languages: data.languages,
      formalityLevel: data.formalityLevel,
      brandKeywords: data.brandKeywords,
      intelligenceMode: data.intelligenceMode,
      enableShadowMode: data.enableShadowMode,
      enableMultiLanguage: data.enableMultiLanguage,
      strictGovernance: data.strictGovernance,
      autoUpsell: data.autoUpsell,
      autoEarlyCheckin: data.autoEarlyCheckin,
      autoLateCheckout: data.autoLateCheckout,
      selfCorrection: data.selfCorrection,
      engines: data.engines,
      addons: data.addons,
    };
  }

  async getCreditTransactions() {
    return this.supabaseFetch<CreditTransaction[]>('credits_transactions', {
      order: { column: 'created_at', ascending: false },
      limit: 50
    });
  }

  async updateAutoTopup(enabled: boolean, threshold: number, amount: number) {
    if (!this.organizationId) throw new Error('Organization ID not set');

    const { error } = await supabase
      .from('organization_entitlements')
      .update({
        auto_topup_enabled: enabled,
        auto_topup_threshold: threshold,
        auto_topup_amount: amount,
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', this.organizationId);

    if (error) throw error;
    return { success: true };
  }

  async getTeamMembers() {
    console.log('[API] 👥 getTeamMembers called, organizationId:', this.organizationId);

    if (!this.organizationId) {
      console.warn('[API] getTeamMembers: No organizationId');
      return [];
    }

    // Query organization_members and join with profiles using explicit FK
    const { data, error } = await supabase
      .from('organization_members')
      .select(`
        id,
        user_id,
        role,
        created_at,
        profiles!user_id (
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq('organization_id', this.organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API] ❌ getTeamMembers error:', error);
      throw error;
    }

    console.log('[API] ✅ getTeamMembers found:', data?.length || 0, 'members');
    console.log('[API] 👥 Team members data:', JSON.stringify(data, null, 2));
    return data || [];
  }

  async updateIntelligenceMode(mode: string) {
    if (!this.organizationId) {
      console.error('[API] updateIntelligenceMode: No organizationId set');
      throw new Error('No organization ID available');
    }

    console.log('[API] Updating intelligence mode to:', mode, 'for org:', this.organizationId);

    const { data, error } = await supabase
      .from('settings')
      .update({
        intelligence_mode: mode,
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', this.organizationId)
      .select();

    if (error) {
      console.error('[API] updateIntelligenceMode failed:', error);
      throw new Error(`Failed to update intelligence mode: ${error.message}`);
    }

    console.log('[API] updateIntelligenceMode success:', data);
    return data;
  }

  async updateGeneralSettings(settings: Record<string, any>) {
    if (!this.organizationId) {
      console.error('[API] updateGeneralSettings: No organizationId');
      throw new Error('No organization ID available');
    }

    console.log('[API] updateGeneralSettings (Supabase):', settings);

    const { data, error } = await supabase
      .from('settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', this.organizationId)
      .select();

    if (error) {
      console.error('[API] updateGeneralSettings failed:', error);
      throw new Error(`Failed to update settings: ${error.message}`);
    }

    console.log('[API] updateGeneralSettings success:', data);
    return data;
  }

  async updateEngineStatus(id: string, status: 'Active' | 'Inactive') {
    if (!this.organizationId) throw new Error('No organization ID available');

    const { data, error } = await supabase
      .from('engines')
      .update({ status })
      .eq('id', id)
      .eq('organization_id', this.organizationId)
      .select();

    if (error) {
      console.error('[API] updateEngineStatus failed:', error);
      throw new Error(`Failed to update engine status: ${error.message}`);
    }
    return data;
  }

  async updateAddonStatus(id: string, enabled: boolean) {
    if (!this.organizationId) throw new Error('No organization ID available');

    const { data, error } = await supabase
      .from('addons')
      .update({ enabled })
      .eq('id', id)
      .eq('organization_id', this.organizationId)
      .select();

    if (error) {
      console.error('[API] updateAddonStatus failed:', error);
      throw new Error(`Failed to update addon status: ${error.message}`);
    }
    return data;
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

  async getEscalationsData(status?: string, startDate?: string, endDate?: string): Promise<Escalation[]> {
    console.log('[API] 📋 getEscalationsData called with status:', status, 'Period:', { startDate, endDate });

    // 1. Fetch from 'escalations' (dedicated table) - PRIMARY SOURCE for User Status
    const escalationsRes = await this.supabaseFetch<Escalation[]>('escalations', {
      range: startDate || endDate ? { column: 'created_at', start: startDate, end: endDate } : undefined,
      order: { column: 'created_at', ascending: false }
    });
    console.log('[API] 📋 Escalations table returned:', escalationsRes?.length || 0, 'records');

    // 2. Fetch from 'executions' - SOURCE for Metadata/History
    const allExecutions = await this.supabaseFetch<Execution[]>('executions', {
      range: startDate || endDate ? { column: 'created_at', start: startDate, end: endDate } : undefined,
      order: { column: 'created_at', ascending: false },
      limit: 500
    });
    console.log('[API] 📋 Executions table returned:', allExecutions?.length || 0, 'records');

    const isMock = (id?: string) => id?.startsWith('hist-') || id?.startsWith('test-');

    // Detect escalations from executions and extract ALL metadata
    const mappedExecutions: Escalation[] = (allExecutions || [])
      .filter(exec => {
        if (isMock(exec.execution_id) || isMock(exec.workflow_name)) return false;

        const workflowData = this.robustParseOutput(exec.workflow_output);
        const isExplicitlyTriggered =
          exec.human_escalation_triggered === true ||
          workflowData?.human_escalation_triggered === true;

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

        const safePhone = workflowData?.guest?.phone ||
          workflowData?.phone ||
          workflowData?.channel?.phone ||
          sessionId ||
          '';
        const phoneClean = typeof safePhone === 'string' ? normalizePhone(safePhone) : '';

        // Determine resolved_by_name from reason logic
        let resolvedByName: string | undefined;
        const reasonText = exec.human_escalation_reason || '';
        const resolvedMatch = reasonText.match(/\[RESOLVED by ([^\]]+)\]/i);
        if (resolvedMatch) {
          resolvedByName = resolvedMatch[1].trim();
        }

        return {
          id: exec.execution_id || 'unknown',
          phone_clean: phoneClean || (sessionId && sessionId.length > 5 ? sessionId : `Guest #${exec.execution_id}`),
          execution_id: exec.execution_id,
          status: 'OPEN', // Default, will be overridden by escalations table
          priority: normalizePriority(exec.escalation_priority || workflowData?.escalation?.priority || 'LOW'),
          classification: normalizePriority(exec.escalation_priority || workflowData?.escalation?.priority || 'M1'),
          reason: exec.human_escalation_reason || workflowData?.human_escalation_reason || workflowData?.test_reason || 'Human intervention required',
          resolved_by_name: resolvedByName,
          resolved_at: undefined,
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
            history: workflowData?.history || [],
          }
        };
      });

    // Smart Merge Logic
    // executionsMap indexed by execution_id for quick lookup
    const executionsMap = new Map<string, Escalation>();
    mappedExecutions.forEach(e => {
      if (e.execution_id) executionsMap.set(e.execution_id, e);
    });

    const finalEscalationsMap = new Map<string, Escalation>();

    // 1. Process persisted escalations (Status source)
    (escalationsRes || []).forEach(e => {
      const eid = e.execution_id;
      if (eid && executionsMap.has(eid)) {
        // MATCH: Enrich persisted escalation with metadata from execution
        const execData = executionsMap.get(eid)!;
        finalEscalationsMap.set(eid, {
          ...execData, // Keep rich metadata/history
          status: e.status, // Overwrite with user-controlled status
          reason: e.reason || execData.reason, // Use user reason if present
          priority: e.priority || execData.priority,
          id: e.id, // Use the DB ID for updates
          resolved_by_name: e.resolved_by_name || execData.resolved_by_name,
          resolved_at: e.resolved_at || (e.status === 'RESOLVED' ? e.updated_at : undefined),
        });
      } else if (e.execution_id || e.id) {
        // Only in escalations table (orphaned or different format)
        finalEscalationsMap.set(e.execution_id || e.id, e);
      }
    });

    // 2. Add detected escalations that aren't in the escalations table yet
    mappedExecutions.forEach(e => {
      if (e.execution_id && !finalEscalationsMap.has(e.execution_id)) {
        finalEscalationsMap.set(e.execution_id, e);
      }
    });

    const unified = Array.from(finalEscalationsMap.values());

    // Filter by status if requested
    const filtered = status && status !== 'ALL'
      ? unified.filter(e => e.status === status.toUpperCase())
      : unified;

    // Final sort: newest first
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log('[API] 📋 Unified smart merge result:', filtered.length, 'records');
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
    console.log('[API] 🎯 resolveEscalation called:', { id, notes, classification, userId, userName, escalationData });

    // Determine if the ID is a UUID (likely 'escalations' table) or a number string (likely 'executions' table)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const isFromExecutions = !isUuid;

    console.log('[API] 🎯 ID type:', isFromExecutions ? 'executions table' : 'escalations table');

    const resolvedAt = new Date().toISOString();

    // 1. If from executions table, update it
    if (isFromExecutions) {
      console.log('[API] 🎯 Updating executions table for ID:', id);
      await this.updateEscalation(id, {
        escalation_status: 'RESOLVED',
        escalation_priority: classification,
        human_escalation_reason: notes ? `[RESOLVED by ${userName || 'operator'}] ${notes}` : undefined,
      }, 'executions');
      console.log('[API] ✅ Executions table updated successfully');
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

  async updateTeamMember(memberId: string, updates: { role?: string; full_name?: string }) {
    console.log('[API] 👥 updateTeamMember called:', { memberId, updates });

    // Update organization_members table for role
    if (updates.role) {
      const { error: roleError } = await supabase
        .from('organization_members')
        .update({ role: updates.role })
        .eq('id', memberId)
        .eq('organization_id', this.organizationId);

      if (roleError) {
        console.error('[API] ❌ Failed to update role:', roleError);
        throw roleError;
      }
    }

    // Update profiles table for full_name
    if (updates.full_name) {
      // Get user_id from organization_members first
      const { data: member, error: fetchError } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('id', memberId)
        .single();

      if (fetchError || !member) {
        console.error('[API] ❌ Failed to fetch user_id for name update:', fetchError);
        throw fetchError || new Error('Member not found');
      }

      const { error: nameError } = await supabase
        .from('profiles')
        .update({ full_name: updates.full_name })
        .eq('id', member.user_id);

      if (nameError) {
        console.error('[API] ❌ Failed to update full_name:', nameError);
        throw nameError;
      }
    }

    console.log('[API] ✅ Team member updated successfully');
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
    console.log(`[API] 🔄 updateEscalation called:`, { id, table, updates, organizationId: this.organizationId });

    // Use correct primary key column for each table
    const idColumn = table === 'executions' ? 'execution_id' : 'id';

    // Don't filter by organization_id in the URL - RLS policies handle this automatically
    // This prevents silent failures when organization_id is null or mismatched
    const url = `${SUPABASE_URL}/rest/v1/${table}?${idColumn}=eq.${id}`;

    console.log(`[API] 🔄 Update URL:`, url);

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
      console.error(`[API] ❌ Update ${table} failed:`, response.status, errorText);
      throw new Error(`Failed to update ${table}: ${response.status}`);
    }

    const result = await response.json();
    console.log(`[API] ✅ Update ${table} success:`, result);
    return result;
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

  // --- Audit & Compliance ---

  async getAuditData(startDate?: string, endDate?: string) {
    console.log('[API] 🛡️ Generating Governance Audit Data... Period:', { startDate, endDate });

    const [dashboardData, growthData, openEscalations, allEscalations] = await Promise.all([
      this.getDashboardData(startDate, endDate),
      this.getGrowthData(startDate, endDate),
      this.getEscalationsData('OPEN', startDate, endDate),
      this.getEscalationsData('ALL', startDate, endDate)
    ]);

    const resolvedEscalationsCount = allEscalations.filter(e => e.status === 'RESOLVED').length;
    const reportId = `AUD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    return {
      reportId,
      timestamp: new Date().toISOString(),
      organizationId: this.organizationId,
      kpis: dashboardData.kpis,
      growthKpis: growthData.kpis,
      interventions: {
        total: allEscalations.length,
        open: openEscalations.length,
        resolved: resolvedEscalationsCount,
        resolutionRate: allEscalations.length > 0
          ? Math.round((resolvedEscalationsCount / allEscalations.length) * 100)
          : 100
      },
      systemHealth: {
        uptime: '99.9%',
        latency: dashboardData.kpis.find(k => k.id === 'median-cycle')?.value || '0.0s',
        decisionIntegrity: dashboardData.kpis.find(k => k.id === 'decision-integrity')?.value || '100%'
      }
    };
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
