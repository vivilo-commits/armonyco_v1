import React from 'react';
import { BaseModal } from '../design-system/BaseModal';
import { Shield, CheckCircle2, AlertCircle, Info, Zap, Activity, ShieldCheck, Cpu, BarChart3 } from 'lucide-react';
import { LANDING_COPY } from '@/frontend/content';

interface ArchitectureDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  constructId: keyof typeof LANDING_COPY.CORE_CONSTRUCTS;
}

export const ArchitectureDetailModal: React.FC<ArchitectureDetailModalProps> = ({
  isOpen,
  onClose,
  constructId,
}) => {
  const data = LANDING_COPY.CORE_CONSTRUCTS[constructId];
  if (!data) return null;
  const getIcon = () => {
    switch (constructId) {
      case 'AEM':
        return <Activity size={24} />;
      case 'ASRS':
        return <ShieldCheck size={24} />;
      case 'AOS':
        return <Cpu size={24} />;
      case 'AIM':
        return <Zap size={24} />;
      case 'AGS':
        return <BarChart3 size={24} />;
      default:
        return <Shield size={24} />;
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={data.TITLE}
      subtitle={data.TAGLINE}
      maxWidth="max-w-4xl"
      icon={getIcon()}
    >
      <div className="space-y-12 py-6">
        {/* Definition Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-[#f5d47c] text-[10px] font-black uppercase tracking-[0.2em]">
            <Info size={14} /> The Definition
          </div>
          <p className="text-xl text-stone-800 font-light leading-relaxed">{data.WHAT_IS}</p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Why it exists */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-stone-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <AlertCircle size={14} /> The Problem Layer
            </div>
            <ul className="space-y-4">
              {data.WHY_EXISTS.map((item, i) => (
                <li key={i} className="flex items-start gap-3 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500/30 mt-1.5 shrink-0 group-hover:bg-red-500 transition-colors" />
                  <span className="text-stone-500 text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Practice */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-stone-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <Zap size={14} /> The Execution Protocol
            </div>
            <ul className="space-y-4">
              {data.PRACTICE.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-xl bg-stone-50 border border-stone-100 hover:border-[#f5d47c]/20 transition-all"
                >
                  <span className="text-[#f5d47c] font-mono text-xs font-bold">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-stone-600 text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Examples / Proof */}
        {data.EXAMPLES && (
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-stone-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <CheckCircle2 size={14} /> Auditable Proof Points
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.EXAMPLES.map((ex, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-stone-50 border border-stone-100 space-y-3 hover:border-gold-start/20 transition-all"
                >
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                    Input: &ldquo;{ex.input}&rdquo;
                  </div>
                  <div className="text-sm font-medium text-stone-900">{ex.execution}</div>
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-fit">
                    <Shield size={10} /> {ex.proof}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Technical Footer */}
        <div className="pt-8 border-t border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-2">
            <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
              Construct Integrity
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className="h-1 w-8 bg-gold-mid-2 rounded-full" />
              ))}
            </div>
          </div>
          <p className="text-[11px] text-stone-400 font-mono italic leading-relaxed">
            {data.CONNECTION}
          </p>
        </div>
      </div>
    </BaseModal>
  );
};
