// Global TypeScript type definitions for Armonyco

// =============================================================================
// SHARED TYPES
// =============================================================================

/**
 * Normalized status for executions
 * Note: Use normalizeStatus() from lib/helpers/normalizers.ts to convert raw strings
 */
export type AppStatus =
  | 'Completed'
  | 'Verified'
  | 'Captured'
  | 'Blocked'
  | 'In Progress'
  | 'Pending'
  | 'Failed';

export type Verdict =
  | 'PASSED'
  | 'FAILED'
  | 'PENDING'
  | 'WARNING'
  | 'FLAGGED'
  | 'HUMAN_REQUIRED'
  | 'UNKNOWN';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical' | 'CRITICAL';

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical' | 'CRITICAL';

// View enum for app navigation
export enum View {
  LANDING = 'LANDING',
  DASHBOARD = 'DASHBOARD',
  GROWTH = 'GROWTH',
  CONVERSATIONS = 'CONVERSATIONS',
  ESCALATIONS = 'ESCALATIONS',
  MESSAGE_LOG = 'MESSAGE_LOG',
  CONTROLS = 'CONTROLS',
  SETTINGS = 'SETTINGS',
  OPERATIONAL_PROTOCOLS = 'OPERATIONAL_PROTOCOLS',
}

// =============================================================================
// COMPONENT VARIANT TYPES
// =============================================================================

export type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'gold';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

export type CardVariant = 'light' | 'dark';

// =============================================================================
// DATA STRUCTURES
// =============================================================================

export interface ExecutionEvent {
  id: string;
  type: string;
  label?: string;
  status: AppStatus;
  verdict?: Verdict;
  risk?: RiskLevel;
  time?: string;
  duration?: string;
  agent?: string;
  active?: boolean;
  latency?: string;
}

export interface EscalationItem {
  id: string;
  priority: Priority;
  sla: string;
  unit: string;
  summary: string;
  status: string;
  assignedTo: string;
  category: 'human-risk' | 'residual-risk';
}

export interface Escalation {
  id: string;
  phone_clean: string;
  execution_id?: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  classification?: string;
  resolution_notes?: string;
  resolved_by?: string;
  resolved_by_name?: string;
  resolved_at?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppHistory {
  id: number;
  session_id: string;
  message: {
    type: 'human' | 'ai' | 'tool';
    content: string;
    additional_kwargs?: Record<string, unknown>;
    response_metadata?: Record<string, unknown>;
    tool_calls?: unknown[];
    [key: string]: unknown;
  };
  organization_id: string | null;
  created_at: string;
}

export interface KPIData {
  label: string;
  value: string;
  sub: string;
}

// =============================================================================
// EXECUTION TYPE (matches Supabase 'executions' table)
// =============================================================================

/**
 * Execution record from the unified 'executions' table
 * This is the single source of truth for all N8N workflow executions
 */
export interface Execution {
  // Primary Key
  id: number;

  // N8N Execution Metadata
  execution_id: string;
  workflow_id: string;
  workflow_name: string; // Lara, Amelia, Elon, James

  // Execution Status
  finished: boolean;
  mode?: string; // trigger, webhook, manual
  status: string; // success, running, error, waiting, cancelled
  retry_of?: string;
  retry_success_id?: string;

  // Timestamps
  n8n_created_at?: string;
  started_at?: string;
  stopped_at?: string;
  deleted_at?: string;
  wait_till?: string;
  duration_ms?: number;

  // Workflow Identification
  trigger_type?: string;
  trigger_node_name?: string;
  parent_execution_id?: string;
  parent_workflow_id?: string;
  is_sub_execution: boolean;

  // Reservation Data
  reservation_code?: string;
  guest_name?: string;
  check_in_date?: string;
  check_out_date?: string;
  nights?: number;
  room?: string;
  guests_count?: number;
  booking_channel?: string;
  reservation_status?: string;
  total_charge?: number;
  currency: string;
  country_code?: string;
  guest_email?: string;
  guest_phone?: string;

  // Communication Channel
  channel_type?: string; // whatsapp, krosschat, email, template

  // WhatsApp Data
  whatsapp_from?: string;
  whatsapp_to?: string;
  whatsapp_message_id?: string;
  whatsapp_message_type?: string;
  whatsapp_message_body?: string;
  whatsapp_contact_name?: string;
  whatsapp_timestamp?: string;

  // KrossChat Data
  kross_message_id?: string;
  kross_conversation_id?: string;
  kross_reservation_id?: string;
  kross_message_type?: string;
  kross_message_body?: string;
  kross_guest_name?: string;
  kross_channel?: string;
  kross_timestamp?: string;

  // Actions Performed
  action_type?: string;
  template_name?: string;
  messages_sent: number;
  checkin_sent: boolean;
  checkout_sent: boolean;
  new_booking_sent: boolean;
  transfer_marketing_sent: boolean;
  breakfast_marketing_sent: boolean;

  // Value Metrics (Growth)
  upsell_offered: boolean;
  upsell_type?: string;
  upsell_accepted: boolean;
  upsell_value?: number;
  late_checkout_offered: boolean;
  late_checkout_accepted: boolean;
  late_checkout_value?: number;
  early_checkin_offered: boolean;
  early_checkin_accepted: boolean;
  early_checkin_value?: number;
  transfer_offered: boolean;
  transfer_accepted: boolean;
  transfer_value?: number;
  breakfast_offered: boolean;
  breakfast_accepted: boolean;
  breakfast_value?: number;
  services_offered: boolean;
  services_accepted: boolean;
  services_value?: number;
  orphan_day_captured: boolean;
  orphan_days_count: number;
  value_captured: number;

  // Human Escalation
  human_escalation_triggered: boolean;
  human_escalation_score?: number;
  human_escalation_flagged: boolean;
  human_escalation_reason?: string;
  human_notified: boolean;
  human_notified_at?: string;

  // Escalation Management
  escalation_priority?: string;
  escalation_status: string;
  escalation_assigned_to?: string;
  escalation_sla_minutes?: number;
  escalation_opened_at?: string;
  escalation_resolved_at?: string;
  escalation_resolution_notes?: string;
  risk_type?: string;
  risk_confidence?: number;

  // AI Metrics
  ai_model?: string;
  ai_tokens_used?: number;
  ai_estimated_tokens?: number;
  ai_response_preview?: string;

  // Governance
  governance_executed: boolean;
  governance_verdict?: string;
  governance_details?: Record<string, unknown>;

  // Error Handling
  error_message?: string;
  error_node?: string;
  error_details?: Record<string, unknown>;

  // Time Saved Metrics
  time_saved_seconds: number;
  time_saved_mode: string;

  // Performance
  nodes_executed?: number;
  slowest_node?: string;
  slowest_node_time_ms?: number;

  // Raw Data
  raw_input?: Record<string, unknown>;
  raw_output?: Record<string, unknown>;

  // System Fields
  created_at: string;
  updated_at: string;
}

// Alias for backward compatibility
export type N8nExecution = Execution;

export interface Message {
  id: string;
  type: 'text' | 'alert' | 'separator' | 'host_template' | 'system_notice';
  sender: 'guest' | 'host' | 'system' | 'agent';
  text?: string;
  time?: string;
  templateData?: Record<string, string | number | boolean>;
}

export interface CRMData {
  pax: string;
  confirmationCode: string;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  note?: string;
  fields: { label: string; val: string }[];
  toPay: string;
  isPaid?: boolean;
}

export interface Conversation {
  id: string;
  name: string;
  initials: string;
  platform: 'booking' | 'airbnb' | 'whatsapp';
  time: string;
  dates: string;
  status: string;
  badge?: string;
  badgeColor?: 'green' | 'blue';
  avatar?: string;
  property?: string;
  subProperty?: string;
  messages: Message[];
  crm: CRMData;
}

export interface KPI {
  id: string;
  label: string;
  value: string;
  trend: number;
  trendLabel: string;
  subtext: string;
  status: 'success' | 'warning' | 'error' | 'neutral' | AppStatus;
}

export interface ScorecardMetric {
  id: string;
  category: string;
  label: string;
  value: string;
  target: string;
  status: 'success' | 'warning' | 'error' | 'neutral';
}

export interface UsageMetric {
  name: string;
  spend: number;
  tokens: number;
  requests: number;
}

export interface TopWin {
  id: string;
  title: string;
  value: string;
  date: string;
  status: 'Approved' | 'Captured' | 'Verified';
}

export interface OperationalProcess {
  id: string;
  area: 'Guest' | 'Revenue' | 'Ops';
  label: string;
  status: 'active' | 'inactive';
  coverage: string;
}

export interface OperationalEvent {
  id: string;
  label: string;
  type: 'Booking' | 'Guest' | 'Revenue' | 'Compliance' | 'Ops';
  active: boolean;
  latency: string;
}

export interface SLADefinition {
  id: string;
  label: string;
  threshold: string;
  actual: string;
  status: 'pass' | 'fail';
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  lastInteraction: string;
  source: string;
}

export interface SystemSettings {
  profile?: {
    brandName: string;
    email: string;
    toneOfVoice: string;
  };
  brandName?: string;
  email?: string;
  companyName: string;
  companyEmail: string;
  timezone: string;
  primaryCurrency: string;
  language: string;
  notifications: {
    [key: string]: boolean | undefined;
    emailDigest: boolean;
    slackAlerts: boolean;
    criticalFailuresOnly: boolean;
    highRisk?: boolean;
    upsellAccepted?: boolean;
    reviewDetected?: boolean;
    systemOverride?: boolean;
  };
  integrations: {
    whatsappToken: string;
    pms: {
      url: string;
      login: string;
      password?: string;
    };
  };
  engineStatus?: 'on' | 'off';
  intelligenceLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface Plan {
  id: string;
  name: string;
  tag: string;
  units: string;
  price: string;
  period: string;
  includedCredits: number;
  features: string[];
  cta: string;
  popular?: boolean;
  stripePriceId?: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  description?: string;
  type: string;
  status: 'active' | 'idle' | 'offline' | 'disabled';
  avatar?: string;
  costPerExec?: number;
  lastActive?: string;
  integration?: string;
  systemId?: string;
  dailyBudget?: number;
  model?: string;
  parameters?: {
    key: string;
    label: string;
    type: string;
    value: string | number | boolean | string[];
    options?: string[];
    description?: string;
  }[];
}
export interface GuestListItem {
  id: string;
  name: string;
  dates: string;
  pax: string;
  unit: string;
  status: string;
}

export interface ChartDataPoint {
  date: string;
  value?: number;
  sold?: number;
  payments?: number;
  production?: number;
  adr?: number;
  revpar?: number;
  ota?: number;
  front?: number;
  be?: number;
}
export interface ControlEngine {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  summary: string;
  type: string;
}

export interface ControlAddon {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  summary: string;
  price: string;
  enabled: boolean;
}
/**
 * AUTH TYPES
 * User profiles, organizations, memberships, and entitlements
 */

export type RoleType = 'owner' | 'manager' | 'viewer';
export type SubscriptionStatus =
  | 'none'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'suspended';

// Legacy support
export type Role = 'Admin' | 'Manager' | 'Viewer';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at?: string;
  // Legacy fields (deprecated)
  first_name?: string | null;
  last_name?: string | null;
  role?: Role;
  organization_id?: string | null;
  invited_by?: string | null;
  is_disabled?: boolean;
  ai_tone?: string;
  language?: string;
  phone?: string | null;
}

export interface Organization {
  id: string;
  name: string;
  logo_url?: string | null;
  created_at: string;
  updated_at?: string;
  // Legacy fields
  email?: string | null;
  website?: string | null;
  owner_id?: string;
  vat_number?: string | null;
  billing_street?: string | null;
  billing_city?: string | null;
  billing_postal?: string | null;
  billing_country?: string | null;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: RoleType;
  created_at: string;
}

export interface OrganizationEntitlements {
  organization_id: string;
  subscription_status: SubscriptionStatus;
  subscription_active: boolean;
  credits_balance: number;
  plan_tier?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  current_period_end?: string | null;
  auto_topup_enabled?: boolean;
  auto_topup_threshold?: number;
  auto_topup_amount?: number;
  updated_at?: string;
}

// Legacy support
export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: number;
  status: 'active' | 'past_due' | 'suspended' | 'cancelled' | 'expired';
  started_at: string;
  expires_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  payment_failed_count: number;
  created_at: string;
}
// Domain-specific types for Armonyco business logic
// Replaces 'any' types with explicit structures

/**
 * Trigger context for workflow executions
 * Replaces: trigger_context?: any
 */
export interface TriggerContext {
  source?: string;
  channel?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Governance evaluation details
 * Replaces: governance_details?: any
 */
export interface GovernanceDetails {
  policy_id?: string;
  policy_version?: string;
  override_detected: boolean;
  human_review: 'REQUIRED' | 'NOT_REQUIRED' | 'PENDING';
  rules_evaluated?: string[];
  confidence_score?: number;
}

/**
 * Evidence data for escalations
 * Replaces: evidence_data?: any
 */
export interface EvidenceData {
  screenshots?: string[];
  logs?: string[];
  traces?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Escalation resolution payload
 * Replaces: escalation_resolution?: any
 */
export interface EscalationResolution {
  resolved_by?: string;
  resolution_type?: 'APPROVED' | 'REJECTED' | 'ESCALATED_FURTHER';
  resolution_notes?: string;
  resolved_at?: string;
  proof_data?: Record<string, unknown>;
}

/**
 * Execution data payload
 * Replaces: execution_data?: any
 */
export interface ExecutionData {
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  intermediate_states?: Record<string, unknown>;
}

/**
 * Execution trace for debugging
 * Replaces: execution_trace?: any
 */
export interface ExecutionTrace {
  steps?: Array<{
    step_id: string;
    step_name: string;
    duration_ms?: number;
    status: string;
    error?: string;
  }>;
  timeline?: Array<{
    timestamp: string;
    event: string;
  }>;
}

/**
 * Raw payload from external systems
 * Replaces: raw_payload?: any
 */
export type RawPayload = Record<string, unknown>;

/**
 * Supabase query builder type (generic)
 * Replaces: (q: any) => Promise<{ data: any; error: any }>
 */
export interface SupabaseQueryResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

export type SupabaseQuery<T> = Promise<SupabaseQueryResult<T>>;
export interface CashflowSummary {
  id: string;
  organization_id: string;
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
