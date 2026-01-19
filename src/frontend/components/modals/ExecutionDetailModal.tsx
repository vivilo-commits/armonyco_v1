import React from 'react';
import { BaseModal, AppCard, AppBadge, AppButton } from '../design-system';
import { ShieldCheck, Layers, Database, ChevronRight } from 'lucide-react';

interface ExecutionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    type: string;
    status: string;
    verdict?: string;
    risk?: string;
    time?: string;
    duration?: string;
  } | null;
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
            <AppBadge variant="success" size="sm">
              {event.status}
            </AppBadge>
          </AppCard>
          <AppCard variant="light" className="p-4 border-l-4 border-l-stone-900">
            <div className="text-[9px] text-stone-400 uppercase tracking-widest font-bold mb-1">
              Verdict
            </div>
            <div className="text-xs font-mono font-bold text-stone-900">
              {event.verdict || 'PASSED'}
            </div>
          </AppCard>
          <AppCard variant="light" className="p-4 border-l-4 border-l-stone-200">
            <div className="text-[9px] text-stone-400 uppercase tracking-widest font-bold mb-1">
              Duration
            </div>
            <div className="text-xs font-mono text-stone-900">{event.duration || '0.8s'}</div>
          </AppCard>
          <AppCard variant="light" className="p-4 border-l-4 border-l-orange-400">
            <div className="text-[9px] text-stone-400 uppercase tracking-widest font-bold mb-1">
              Risk Score
            </div>
            <div className="text-xs font-bold text-stone-900">{event.risk || 'Low'}</div>
          </AppCard>
        </div>

        {/* Workflow Path */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Layers size={16} className="text-stone-400" />
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
              Execution Path
            </h5>
          </div>
          <div className="space-y-3">
            {[
              {
                step: 'Input Validation',
                desc: 'Verified guest identity and booking status',
                time: '0ms',
              },
              {
                step: 'Policy Retrieval',
                desc: 'Retrieved "Refund_Policy_v2" from memory',
                time: '120ms',
              },
              {
                step: 'Cognitive Analysis',
                desc: 'Amelia-v4 evaluated request vs constraints',
                time: '450ms',
              },
              {
                step: 'Action Execution',
                desc: 'Applied approved adjustment to PMS',
                time: '210ms',
              },
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
          <div className="bg-stone-900 rounded-2xl p-6 font-mono text-[11px] text-stone-300 leading-relaxed overflow-x-auto shadow-inner">
            <pre>
              {`{
  "id": "${event.id}",
  "workflow": "${event.type}",
  "agent_id": "amelia_v4_institutional",
  "payload": {
    "guest_id": "G-9021",
    "request_type": "LATE_CHECKOUT",
    "requested_time": "14:00",
    "pms_synced": true,
    "revenue_captured": 25.00
  },
  "governance": {
    "policy_id": "POL-882",
    "override_detected": false,
    "human_review": "NOT_REQUIRED"
  },
  "timestamp": "2024-05-20T14:02:12Z"
}`}
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
