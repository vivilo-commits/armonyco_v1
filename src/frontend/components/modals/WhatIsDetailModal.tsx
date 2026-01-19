import React from 'react';
import { BaseModal } from '../design-system/BaseModal';
import { Zap, Layers, Target, ShieldCheck, Cpu, BarChart3 } from 'lucide-react';

interface WhatIsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'WHAT' | 'HOW' | 'RESULT';
  content: {
    TITLE: string;
    TAGLINE: string;
    DESC: string;
    DETAILS: string;
  };
}

export const WhatIsDetailModal: React.FC<WhatIsDetailModalProps> = ({
  isOpen,
  onClose,
  type,
  content,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'WHAT':
        return <Zap size={24} />;
      case 'HOW':
        return <Layers size={24} />;
      case 'RESULT':
        return <Target size={24} />;
      default:
        return null;
    }
  };

  const getHighlightIcon = () => {
    switch (type) {
      case 'WHAT':
        return <Cpu size={20} />;
      case 'HOW':
        return <ShieldCheck size={20} />;
      case 'RESULT':
        return <BarChart3 size={20} />;
      default:
        return null;
    }
  };

  const getHighlightTitle = () => {
    switch (type) {
      case 'WHAT':
        return 'Industrial Intelligence';
      case 'HOW':
        return 'Structural Integrity';
      case 'RESULT':
        return 'Fiduciary Proof';
      default:
        return '';
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={content.TITLE}
      subtitle={content.TAGLINE}
      icon={getIcon()}
    >
      <div className="space-y-10 py-6">
        <div className="space-y-6">
          <p className="text-2xl text-stone-900 font-serif leading-tight">{content.DESC}</p>

          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-8 gold-gradient" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold-mid-2">
              The Proof
            </span>
          </div>

          <div className="relative group p-8 rounded-3xl bg-stone-50 border border-stone-100 hover:border-gold-start/20 transition-all duration-500">
            <div className="absolute top-4 right-4 text-gold-start/20 group-hover:text-gold-start/40 transition-colors">
              {getHighlightIcon()}
            </div>
            <p className="text-stone-600 leading-relaxed font-light text-lg">{content.DETAILS}</p>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-100 space-y-3">
            <div className="text-[10px] font-black text-gold-mid-2 uppercase tracking-[0.2em]">
              {getHighlightTitle()}
            </div>
            <p className="text-stone-500 text-sm leading-relaxed">
              {type === 'WHAT' &&
                'Armonyco acts as your operational brain, understanding context and making intelligent decisions 24/7.'}
              {type === 'HOW' &&
                'Built on cutting-edge AI models with custom training for institutional hospitality operations.'}
              {type === 'RESULT' &&
                'We achieve a 99% reduction in human operational errors, delivering total clarity on where every cent and communication originates.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-serif text-stone-900 mb-1">
                {type === 'WHAT' && '100%'}
                {type === 'HOW' && '5 Cores'}
                {type === 'RESULT' && '44%'}
              </div>
              <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                {type === 'WHAT' && 'Coverage'}
                {type === 'HOW' && 'Architectural Logic'}
                {type === 'RESULT' && 'Income Increase'}
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-serif text-stone-900 mb-1">
                {type === 'WHAT' && 'Active'}
                {type === 'HOW' && 'Immutable'}
                {type === 'RESULT' && '70.9s'}
              </div>
              <div className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">
                {type === 'WHAT' && 'Status'}
                {type === 'HOW' && 'System Layer'}
                {type === 'RESULT' && 'Avg. Runtime'}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-stone-100 text-center">
          <p className="text-[10px] text-stone-400 font-mono tracking-widest uppercase italic">
            Governed by Armonyco Reliability System™
          </p>
        </div>
      </div>
    </BaseModal>
  );
};
