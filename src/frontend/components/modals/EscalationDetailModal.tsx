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
import { Escalation, WhatsAppHistory } from '@/backend/types';

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
  const [showProofForm, setShowProofForm] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [history, setHistory] = React.useState<WhatsAppHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = React.useState(false);
  const [formData, setFormData] = React.useState({
    notes: '',
    classification: escalation?.classification || 'M1',
  });

  React.useEffect(() => {
    if (isOpen && escalation?.phone_clean) {
      loadContext();
    } else {
      setShowProofForm(false);
      setHistory([]);
    }
  }, [isOpen, escalation]);

  const loadContext = async () => {
    if (!escalation?.phone_clean) return;
    setLoadingHistory(true);
    try {
      const { history: historyData } = await api.getEscalationContext(escalation.phone_clean);
      setHistory(historyData);
    } catch (e) {
      console.error('Failed to load escalation context', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleResolve = async () => {
    if (!escalation) return;
    setIsSubmitting(true);
    try {
      await api.resolveEscalation(escalation.id, formData.notes, formData.classification);
      onResolved?.();
      onClose();
    } catch (e) {
      console.error('Failed to resolve escalation', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!escalation) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={showProofForm ? 'Resolution Summary' : 'Intervention Detail'}
    >
      <div className="space-y-8 px-1">
        {!showProofForm ? (
          <>
            {/* Header Info */}
            <div className="flex items-start justify-between bg-stone-900 p-8 rounded-[2rem] text-white">
              <div className="space-y-3">
                <AppBadge variant={escalation.classification === 'Critical' ? 'error' : 'warning'}>
                  {escalation.classification || 'M1'} Priority
                </AppBadge>
                <h3 className="text-xl font-bold font-serif">{escalation.phone_clean}</h3>
                <div className="flex items-center gap-4 text-xs text-stone-400 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Shield size={14} /> ID: {escalation.id.substring(0, 8)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} /> {new Date(escalation.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-stone-500 uppercase tracking-widest font-bold mb-1">
                  Status
                </div>
                <div className="text-gold-gradient font-bold uppercase tracking-widest text-xs">
                  Escalation Open
                </div>
              </div>
            </div>

            {/* Context Details */}
            <div className="grid grid-cols-2 gap-4">
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
                  Escalation Reason
                </div>
                <div className="text-xs font-bold text-stone-700 truncate">
                  {escalation.metadata?.reason || 'Human interaction requested'}
                </div>
              </AppCard>
            </div>

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
                    const isInbound = h.message?.type === 'human';
                    return (
                      <div
                        key={h.id}
                        className={`flex flex-col ${isInbound ? 'items-start' : 'items-end'}`}
                      >
                        <div
                          className={`
                            max-w-[85%] p-3 rounded-2xl text-xs
                            ${isInbound
                              ? 'bg-white border border-stone-200 text-stone-800'
                              : 'bg-stone-900 text-white shadow-md'}
                          `}
                        >
                          {h.message?.content || 'Empty message'}
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
              <AppButton
                variant="primary"
                className="flex-1"
                onClick={() => setShowProofForm(true)}
                icon={<CheckCircle2 size={18} />}
              >
                Resolve Escalation
              </AppButton>
              <AppButton variant="secondary" onClick={onClose}>
                Keep Open
              </AppButton>
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
