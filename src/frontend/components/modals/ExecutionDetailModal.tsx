import React from 'react';
import { BaseModal, AppCard, AppBadge, AppButton } from '../design-system';
import { ShieldCheck, Layers, Database, ChevronRight } from 'lucide-react';
import { ExecutionEvent } from '@/backend/types';

interface ExecutionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ExecutionEvent | null;
}

export const ExecutionDetailModal: React.FC<ExecutionDetailModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  if (!event) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Execution Detail">
      <div className="space-y-8 px-1">
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AppCard variant="light" className="p-4 border-l-4 border-l-gold-start">
            <div className="text-[9px] text-stone-400 uppercase tracking-widest font-bold mb-1">
              Status
            </div>
            <AppBadge variant={event.status.toLowerCase().includes('fail') ? 'error' : 'success'} size="sm">
              {event.status}
            </AppBadge>
          </AppCard>
          <AppCard variant="light" className="p-4 border-l-4 border-l-stone-900">
            <div className="text-[9px] text-stone-400 uppercase tracking-widest font-bold mb-1">
              Verdict
            </div>
            <div className="text-xs font-mono font-bold text-stone-900">
              {event.verdict || 'N/A'}
            </div>
          </AppCard>
          <AppCard variant="light" className="p-4 border-l-4 border-l-stone-200">
            <div className="text-[9px] text-stone-400 uppercase tracking-widest font-bold mb-1">
              Duration
            </div>
            <div className="text-xs font-mono text-stone-900">{event.duration || '—'}</div>
          </AppCard>
          <AppCard variant="light" className="p-4 border-l-4 border-l-orange-400">
            <div className="text-[9px] text-stone-400 uppercase tracking-widest font-bold mb-1">
              Complexity
            </div>
            <div className="text-xs font-bold text-stone-900">{event.is_multiple ? 'Multiple' : 'Single'}</div>
          </AppCard>
        </div>

        {/* Workflow Path */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Layers size={16} className="text-stone-400" />
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
              Execution Trace
            </h5>
          </div>
          <div className="space-y-3">
            {[
              {
                step: 'Workflow Initiation',
                desc: `Started ${event.type} protocol`,
                time: '0ms',
              },
              {
                step: 'Governance Check',
                desc: `Verdict: ${event.verdict || 'PENDING'}`,
                time: '120ms',
              },
              {
                step: 'Agent Context',
                desc: `Operating as ${event.agent || 'Amelia-v4'}`,
                time: '450ms',
              },
              ...(event.messages_sent ? [{
                step: 'Communication',
                desc: `Sent ${event.messages_sent} message(s) via WhatsApp`,
                time: '210ms',
              }] : []),
            ].map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-4 bg-stone-50/50 p-4 rounded-xl border border-stone-100 group hover:border-gold-start/30 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-white border border-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-400 shadow-sm">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-stone-900">{step.step}</div>
                  <p className="text-[10px] text-stone-500 mt-0.5">{step.desc}</p>
                </div>
                <div className="text-[10px] font-mono text-stone-300 group-hover:text-gold-start transition-colors">
                  {step.time}
                </div>
                <ChevronRight size={14} className="text-stone-300" />
              </div>
            ))}
          </div>
        </div>

        {/* Raw Truth Data */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Database size={16} className="text-stone-400" />
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
              Truth Data (JSON)
            </h5>
          </div>
          <div className="bg-stone-900 rounded-2xl p-6 font-mono text-[11px] text-stone-300 leading-relaxed overflow-x-auto shadow-inner max-h-[300px]">
            <pre>
              {JSON.stringify({
                id: event.id,
                workflow: event.type,
                agent_id: event.agent,
                workflow_output: event.workflow_output,
                risk: event.risk,
                verdict: event.verdict
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      <div className="mt-10 flex gap-3">
        <AppButton variant="primary" className="flex-1" icon={<ShieldCheck size={18} />}>
          Print Proof Certificate
        </AppButton>
        <AppButton variant="secondary" onClick={onClose}>
          Close View
        </AppButton>
      </div>
    </BaseModal>
  );
};
