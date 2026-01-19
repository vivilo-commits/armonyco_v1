import React from 'react';
import { BaseModal } from '../design-system/BaseModal';
import { LANDING_COPY } from '@/frontend/content';
import { Shield, BookOpen } from 'lucide-react';

interface ManifestoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManifestoModal: React.FC<ManifestoModalProps> = ({ isOpen, onClose }) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="The Armonyco Manifesto"
      subtitle="The Institutional Protocol for the Decision Era"
      maxWidth="max-w-4xl"
      icon={<BookOpen size={24} />}
    >
      <div className="space-y-16 py-10">
        {/* Intro */}
        <div className="text-center max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-mid-2/10 border border-gold-mid-2/20 text-gold-mid-2 text-[10px] font-bold uppercase tracking-widest">
            <Shield size={12} /> Institutional Grade
          </div>
          <h3 className="text-3xl font-serif text-stone-900 leading-tight">
            Governance is not a feature. <br />
            <span className="text-gold-gradient italic">It is the immutable layer of truth.</span>
          </h3>
          <p className="text-stone-500 font-light leading-relaxed">
            Armonyco represents a fundamental structural shift. We do not build software to help
            people work; we build an Operating System to protect institutional value through
            autonomous governance.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12">
          {LANDING_COPY.MANIFESTO.map((clause) => (
            <div key={clause.id} className="relative group">
              {/* Vertical line indicator */}
              <div className="absolute -left-8 top-0 bottom-0 w-[1px] bg-gradient-to-b from-gold-mid-2/40 via-gold-mid-2/10 to-transparent group-hover:from-gold-mid-2 transition-all duration-500" />

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-serif text-stone-200 group-hover:text-gold-mid-2/20 transition-colors duration-500 tabular-nums">
                    {clause.id}
                  </span>
                  <h4 className="text-xl font-bold text-stone-900 tracking-tight group-hover:text-gold-mid-2 transition-colors duration-300">
                    {clause.title}
                  </h4>
                </div>

                <div className="pl-2 space-y-6">
                  <p className="text-stone-600 leading-relaxed font-light text-base">
                    {clause.content}
                  </p>

                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {clause.bullets.map((bullet, bIdx) => (
                      <li
                        key={bIdx}
                        className="flex items-start gap-3 p-4 rounded-xl bg-stone-50 border border-stone-100 hover:border-gold-mid-2/20 transition-all duration-300"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-gold-mid-2/40 mt-1.5 shrink-0" />
                        <span className="text-stone-500 text-sm leading-relaxed">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Ending Statement */}
        <div className="pt-10 border-t border-stone-100 text-center">
          <p className="text-stone-400 text-xs uppercase tracking-[0.3em] font-bold italic">
            &ldquo;Everything else is just automation. This is Armonyco.&rdquo;
          </p>
        </div>
      </div>
    </BaseModal>
  );
};
