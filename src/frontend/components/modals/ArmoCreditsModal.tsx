import React from 'react';
import { BaseModal } from '../design-system/BaseModal';
import { Zap } from 'lucide-react';

interface ArmoCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArmoCreditsModal: React.FC<ArmoCreditsModalProps> = ({ isOpen, onClose }) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Armo Credits"
      subtitle="Your operational currency for intelligent automation"
      icon={<Zap size={24} />}
    >
      <div className="space-y-6 py-4">
        <div className="bg-stone-50 border border-stone-100 p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg gold-gradient shadow-gold-glow">
              <Zap size={24} className="text-stone-900" />
            </div>
            <h3 className="text-xl font-serif text-stone-900">The Power of Credits</h3>
          </div>
          <p className="text-stone-600 leading-relaxed font-light">
            Armo Credits power every interaction, automation, and intelligent decision made by
            DecisionOS™. Think of them as the high-octane fuel for your operational efficiency.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              title: 'Volume & Complexity',
              desc: '1 ArmoCredit represents a precise unit of operational capacity. Simple tasks consume minimal credits, while complex multi-agent reasoning consumes more, perfectly proportional to the depth of the handled request.',
            },
            {
              title: 'The Intelligence Mix',
              desc: "We utilize a blend of the world's most advanced AI models (Gemini, Claude, Grok) via **OpenRouter**. Armo Credits standardize these diverse capabilities into a single, predictable unit of governance: **1,000 tokens = 1 Armo Credit**.",
            },
            {
              title: 'Automated Continuity',
              desc: 'Never run out of operational capacity. When your balance reaches 10,000 credits, the system automatically tops up another 10,000 to ensure 24/7 governance.',
            },
            {
              title: 'Fiduciary Transparency',
              desc: 'Credits roll over month to month. You only pay for the intelligence you actually consume, ensuring total economic alignment with your operation.',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="group p-4 rounded-xl bg-white border border-stone-100 hover:border-gold-start/20 transition-all"
            >
              <h4 className="font-bold text-stone-900 mb-1 flex items-center gap-2 text-sm uppercase tracking-wider">
                <span className="text-gold-mid-2">•</span> {item.title}
              </h4>
              <p className="text-xs text-stone-500 font-light pl-4">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-stone-50 p-6 rounded-xl border border-stone-100 text-center">
          <p className="text-[10px] text-stone-400 font-mono tracking-widest uppercase italic">
            Governed by Armonyco Reliability System™
          </p>
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={onClose}
            className="px-10 py-3 bg-stone-900 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-stone-800 transition-all shadow-lg"
          >
            Got It
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
