import { Execution } from './types';

/**
 * n8n Workflow Client
 * Centralized client for interacting with n8n workflows
 */

// Environment variables
const GET_IN_TOUCH_WEBHOOK = import.meta.env.VITE_N8N_GET_IN_TOUCH_WEBHOOK;

// Type definitions
export interface GetInTouchFormData {
  name: string;
  email: string;
  company: string;
  message: string;
}

export interface GetInTouchResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface GovernedCashflowData {
  totalRevenue: number;
  upsellAcceptanceRate: number;
  orphanDaysCaptured: number;
  lateCheckoutRevenue: number;
  earlyCheckinRevenue: number;
  servicesRevenue: number;
  hoursSaved: number;
  escalationsAvoided: number;
  currency: string;
  lastUpdated: string;
}

/**
 * Submit Get In Touch form to n8n workflow
 */
export async function submitGetInTouch(
  formData: GetInTouchFormData
): Promise<GetInTouchResponse> {
  if (!GET_IN_TOUCH_WEBHOOK) {
    throw new Error('Get In Touch webhook URL not configured');
  }

  try {
    const response = await fetch(GET_IN_TOUCH_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Form submitted successfully',
    };
  } catch (error) {
    console.error('[n8n] Get In Touch submission failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get Governed Cashflow data
 * This function pulls financial data from Supabase executions table
 * since the Governed Cashflow workflow is scheduled (not webhook-triggered)
 */
export async function getGovernedCashflowData(
  executions: Execution[]
): Promise<GovernedCashflowData> {
  // Calculate metrics from executions data
  const totalRevenue = executions.reduce((sum, exec) => sum + (exec.value_captured || 0), 0);
  
  const upsellOffers = executions.filter(e => e.upsell_offered).length;
  const upsellAccepted = executions.filter(e => e.upsell_accepted).length;
  const upsellAcceptanceRate = upsellOffers > 0 ? (upsellAccepted / upsellOffers) * 100 : 0;

  const orphanDaysCaptured = executions.reduce(
    (sum, exec) => sum + (exec.orphan_days_count || 0),
    0
  );

  const lateCheckoutRevenue = executions.reduce(
    (sum, exec) => sum + (exec.late_checkout_value || 0),
    0
  );

  const earlyCheckinRevenue = executions.reduce(
    (sum, exec) => sum + (exec.early_checkin_value || 0),
    0
  );

  const servicesRevenue = executions.reduce(
    (sum, exec) => sum + (exec.services_value || 0) + (exec.breakfast_value || 0) + (exec.transfer_value || 0),
    0
  );

  const hoursSaved = executions.reduce(
    (sum, exec) => sum + (exec.time_saved_seconds || 0),
    0
  ) / 3600; // Convert seconds to hours

  const escalationsAvoided = executions.filter(
    e => !e.human_escalation_triggered
  ).length;

  return {
    totalRevenue,
    upsellAcceptanceRate,
    orphanDaysCaptured,
    lateCheckoutRevenue,
    earlyCheckinRevenue,
    servicesRevenue,
    hoursSaved,
    escalationsAvoided,
    currency: 'EUR',
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Retry helper for failed requests
 */
async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }

  throw lastError;
}

export const n8nClient = {
  submitGetInTouch,
  getGovernedCashflowData,
  retryRequest,
};
