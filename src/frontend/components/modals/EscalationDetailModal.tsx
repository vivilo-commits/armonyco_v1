import React from 'react';
import { BaseModal, AppCard, AppButton, AppBadge } from '../design-system';
import {
  CheckCircle2,
  FileText,
  History,
  Shield,
  Loader2,
  Clock,
} from 'lucide-react';
import { api } from '@/backend/api';
import { cleanMessageContent } from '@/backend/utils';
import { Escalation, WhatsAppHistory } from '@/backend/types';
import { useAuth } from '../../contexts/AuthContext';
import { ASSETS } from '@/frontend/assets';

interface EscalationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  escalation: Escalation | null;
  onResolved?: () => void;
}

export const EscalationDetailModal: React.FC<EscalationDetailModalProps> = ({
  isOpen,
  onClose,
  escalation,
  onResolved,
}) => {
  const { canEdit, user, profile } = useAuth();
  const [showProofForm, setShowProofForm] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [history, setHistory] = React.useState<WhatsAppHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [formData, setFormData] = React.useState({
    notes: '',
    classification: escalation?.classification || 'M1',
  });

  React.useEffect(() => {
    // Load context if we have any identifier (phone_clean, session_id, or ai_output for healing)
    const hasIdentifier = escalation?.phone_clean || escalation?.metadata?.session_id || escalation?.metadata?.ai_output;
    if (isOpen && hasIdentifier) {
      loadContext();
    } else {
      setShowProofForm(false);
      setHistory([]);
    }
  }, [isOpen, escalation]);

  const loadContext = async () => {
    if (!escalation) return;
    setLoadingHistory(true);
    try {
      // Pass both the identifier (phone/session) AND the ai_output content for healing
      // This allows the backend to find the correct session if the initial ID is missing (e.g. 17816)
      const identifier = escalation.phone_clean || escalation.metadata?.session_id;
      const aiOutput = escalation.metadata?.ai_output;

      const { history: historyData } = await api.getEscalationContext(identifier, aiOutput);
      setHistory(historyData);
    } catch (e) {
      console.error('Failed to load escalation context', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!escalation) return;
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      // Determine which table the escalation came from
      // If execution_id differs from id, it's from the escalations table
      const isFromEscalationsTable = escalation.execution_id && escalation.execution_id !== escalation.id;

      if (isFromEscalationsTable) {
        // Update escalations table with its field names
        await api.updateEscalation(escalation.id, {
          resolution_notes: formData.notes,
          priority: formData.classification,
        }, 'escalations');
      } else {
        // Update executions table with its field names
        await api.updateEscalation(escalation.id, {
          escalation_priority: formData.classification,
          human_escalation_reason: formData.notes || escalation.reason,
        }, 'executions');
      }
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) {
      console.error('Failed to save escalation details', e);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResolve = async () => {
    if (!escalation) return;
    setIsSubmitting(true);
    try {
      // Use profile from AuthContext - full_name is set in Settings
      const resolverName = profile?.full_name || user?.email || 'System Operator';

      await api.resolveEscalation(
        escalation.id,
        formData.notes,
        formData.classification,
        user?.id,
        resolverName,
        // Pass additional data for escalations table
        {
          phone_clean: escalation.phone_clean,
          reason: escalation.reason || escalation.metadata?.reason,
          workflow: escalation.metadata?.workflow,
          trigger_message: escalation.metadata?.trigger_message,
        }
      );
      onResolved?.();
      onClose();
    } catch (e) {
      console.error('Failed to resolve escalation', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReopen = async () => {
    if (!escalation) return;
    setIsSubmitting(true);
    try {
      await api.reopenEscalation(escalation.id);
      onResolved?.(); // Refresh lists
      onClose();
    } catch (e) {
      console.error('Failed to reopen escalation', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!escalation) return null;

  const isResolved = escalation.status === 'RESOLVED';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Armonyco | DecisionOS™"
      subtitle={showProofForm ? 'Resolution Summary' : 'Intervention Detail'}
      icon={<img src={ASSETS.logos.armonyco} alt="Armonyco" className="w-8 h-8 object-contain" />}
    >
      <div className="space-y-8 px-1">
        {!showProofForm ? (
          <>
            {/* Header Info */}
            <div className="bg-stone-900 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold-start/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-gold-start/20 transition-all duration-500" />

              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <AppBadge variant={escalation.classification === 'Critical' ? 'error' : 'warning'}>
                      {escalation.classification || 'M1'} Priority
                    </AppBadge>
                    {isResolved && (
                      <AppBadge variant="success">RESOLVED</AppBadge>
                    )}
                  </div>

                  <h3 className="text-2xl font-black font-serif tracking-tight">{escalation.phone_clean}</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mt-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-stone-500 uppercase tracking-widest font-black mb-1">Opened At</span>
                      <span className="text-xs text-stone-300 font-mono flex items-center gap-2">
                        <Clock size={12} className="text-gold-start" /> {new Date(escalation.created_at).toLocaleString()}
                      </span>
                    </div>

                    {isResolved && (
                      <div className="flex flex-col">
                        <span className="text-[10px] text-stone-500 uppercase tracking-widest font-black mb-1">Resolved By</span>
                        <span className="text-xs text-green-400 font-mono flex items-center gap-2 uppercase">
                          <CheckCircle2 size={12} /> {escalation.resolved_by_name || escalation.metadata?.resolved_by_name || 'System Operator'}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col">
                      <span className="text-[10px] text-stone-500 uppercase tracking-widest font-black mb-1">Escalation ID</span>
                      <span className="text-xs text-stone-400 font-mono">
                        #{escalation.id.substring(0, 8)}
                      </span>
                    </div>

                    {isResolved && (
                      <div className="flex flex-col">
                        <span className="text-[10px] text-stone-500 uppercase tracking-widest font-black mb-1">Resolved At</span>
                        <span className="text-xs text-stone-300 font-mono">
                          {escalation.resolved_at
                            ? new Date(escalation.resolved_at).toLocaleString()
                            : escalation.updated_at
                              ? new Date(escalation.updated_at).toLocaleString()
                              : '--'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-stone-500 uppercase tracking-widest font-black mb-1">
                    Context Source
                  </div>
                  <div className="text-gold-gradient font-black uppercase tracking-widest text-xs flex items-center gap-1.5 justify-end">
                    <Shield size={14} /> {escalation.metadata?.workflow || 'Amelia Core'}
                  </div>
                </div>
              </div>
            </div>

            {/* Context Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AppCard variant="light" className="p-5">
                <div className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mb-2">
                  Source Trigger
                </div>
                <div className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <FileText size={16} className="text-stone-400" />
                  {escalation.metadata?.workflow || 'System'}
                </div>
              </AppCard>

              <AppCard variant="light" className="p-5">
                <div className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mb-2">
                  Risk Score
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-bold text-stone-900">
                    {escalation.metadata?.risk_type || 'Standard'}
                  </div>
                  {escalation.metadata?.score !== undefined && (
                    <AppBadge variant={Number(escalation.metadata.score) > 0.8 ? 'error' : 'warning'}>
                      {Math.round(Number(escalation.metadata.score) * 100)}%
                    </AppBadge>
                  )}
                </div>
              </AppCard>

              <AppCard variant="light" className="p-5">
                <div className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mb-2">
                  Escalation Reason
                </div>
                <div className="text-xs font-bold text-stone-700 truncate" title={escalation.metadata?.reason}>
                  {escalation.metadata?.reason || 'Human interaction requested'}
                </div>
              </AppCard>
            </div>

            {/* Escalation Notes & Classification - Editable */}
            <AppCard variant="light" className="p-6 space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 ml-1">
                    Classification
                  </label>
                  <select
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-gold-start"
                    value={formData.classification}
                    onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
                    disabled={!canEdit}
                  >
                    <option value="M1">M1 (Standard)</option>
                    <option value="M2">M2 (Follow-up)</option>
                    <option value="M3">M3 (Priority)</option>
                    <option value="Critical">Critical Issue</option>
                  </select>
                </div>
                <div className="flex-[2] space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 ml-1">
                    {isResolved ? 'Resolution Notes' : 'Progress Notes'}
                  </label>
                  <textarea
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-gold-start min-h-[80px]"
                    placeholder="Enter resolution notes or progress updates..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={!canEdit}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  {saveStatus === 'success' && (
                    <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1 animate-in fade-in transition-all">
                      <CheckCircle2 size={12} /> Changes Saved
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">
                      Failed to save
                    </span>
                  )}
                </div>
                {canEdit && (
                  <AppButton
                    variant="secondary"
                    size="sm"
                    onClick={handleSaveDetails}
                    loading={isSaving}
                  >
                    Save Changes
                  </AppButton>
                )}
              </div>
            </AppCard>

            {/* Trigger Message - The message that caused the escalation */}
            {escalation.metadata?.trigger_message && (
              <AppCard variant="light" className="p-5">
                <div className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mb-3">
                  Triggering Message
                </div>
                <div className="bg-stone-50 border border-stone-100 rounded-xl p-4">
                  <p className="text-sm text-stone-700 leading-relaxed italic">
                    "{escalation.metadata.trigger_message}"
                  </p>
                </div>
              </AppCard>
            )}

            {/* WhatsApp Context */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <History size={16} className="text-stone-400" />
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                  Recent WhatsApp Context
                </h5>
              </div>
              <div className="bg-stone-50 rounded-[2rem] p-6 max-h-[300px] overflow-y-auto border border-stone-100 space-y-4">
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-10 text-stone-400 italic text-xs">
                    Loading conversation context...
                  </div>
                ) : history.length === 0 ? (
                  <div className="flex items-center justify-center py-10 text-stone-400 italic text-xs">
                    No recent history found for this number.
                  </div>
                ) : (
                  history.map((h) => {
                    // STRICTOR FILTERING: Filter by type FIRST
                    if (h.message?.type === 'tool') return null;

                    const cleanedText = cleanMessageContent(h.message?.content || '');

                    // Filter out:
                    // 1. Empty messages (from AI or human)
                    // 2. Tool traces / internal processing messages
                    // 3. Messages with only whitespace
                    if (!cleanedText || cleanedText.trim() === '') return null;

                    const isInbound = h.message?.type === 'human';
                    const isTrigger = escalation.metadata?.message_id && (String(h.id) === String(escalation.metadata.message_id));

                    return (
                      <div
                        key={h.id}
                        className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}
                      >
                        {isTrigger && (
                          <span className="text-[10px] text-gold-end font-bold uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1 animate-pulse">
                            <Shield size={10} /> Escalation Trigger
                          </span>
                        )}
                        <div
                          className={`
                            max-w-[85%] p-3 rounded-2xl text-xs transition-all duration-500
                            ${isInbound
                              ? 'bg-white border text-stone-800 ' + (isTrigger ? 'border-gold-end shadow-lg shadow-gold-start/20' : 'border-stone-200')
                              : 'bg-stone-900 text-white shadow-md'}
                          `}
                        >
                          {cleanedText}
                        </div>
                        <span className="text-[9px] text-stone-400 mt-1 font-mono">
                          {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-stone-100 flex gap-3">
              {isResolved ? (
                <AppButton
                  variant="primary"
                  className="flex-1 gold-gradient !text-stone-900"
                  onClick={handleReopen}
                  disabled={isSubmitting}
                  icon={isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Shield size={18} />}
                >
                  {isSubmitting ? 'Reopening...' : 'Reopen Escalation'}
                </AppButton>
              ) : (
                <>
                  <AppButton
                    variant="primary"
                    className="flex-1"
                    onClick={() => setShowProofForm(true)}
                    icon={<CheckCircle2 size={18} />}
                    disabled={!canEdit}
                  >
                    Resolve Escalation
                  </AppButton>
                  <AppButton variant="secondary" onClick={onClose}>
                    Keep Open
                  </AppButton>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Resolution Form */}
            <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 mb-8">
              <p className="text-xs text-stone-600 leading-relaxed italic">
                Closing this escalation marks it as RESOLVED. Please provide outcome notes for institutional memory.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="classification"
                  className="text-[10px] font-bold uppercase tracking-widest text-stone-500 ml-1"
                >
                  Confirm Classification
                </label>
                <select
                  id="classification"
                  className="w-full p-4 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-gold-start"
                  value={formData.classification}
                  onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
                >
                  <option value="M1">M1 (Standard)</option>
                  <option value="M2">M2 (Follow-up)</option>
                  <option value="M3">M3 (Priority)</option>
                  <option value="Critical">Critical Issue</option>
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="evidence-notes"
                  className="text-[10px] font-bold uppercase tracking-widest text-stone-500 ml-1"
                >
                  Resolution Notes
                </label>
                <textarea
                  id="evidence-notes"
                  className="w-full p-4 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-gold-start min-h-[150px]"
                  placeholder="What was discussed or done to resolve this?"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-8 border-t border-stone-100 flex gap-3">
              <AppButton
                variant="primary"
                className="flex-1"
                onClick={handleResolve}
                disabled={isSubmitting || !formData.notes}
                icon={
                  isSubmitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <CheckCircle2 size={18} />
                  )
                }
              >
                {isSubmitting ? 'Resolving...' : 'Confirm Resolution'}
              </AppButton>
              <AppButton
                variant="secondary"
                onClick={() => setShowProofForm(false)}
                disabled={isSubmitting}
              >
                Go Back
              </AppButton>
            </div>
          </>
        )}
      </div>
    </BaseModal>
  );
};
