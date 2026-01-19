import React from 'react';
import { KPI } from '@/backend/types';

interface AppKPICardProps {
  kpi: KPI;
  variant?: 'light' | 'dark' | 'gold';
}

export const AppKPICard: React.FC<AppKPICardProps> = ({ kpi, variant = 'dark' }) => {
  if (variant === 'gold') {
    return (
      <div className="relative group overflow-hidden rounded-2xl bg-stone-900 border border-stone-800 p-5 md:p-6 transition-all duration-700 hover:border-gold-start/40 shadow-gold-glow h-full min-h-[120px] flex flex-col justify-center">
        {/* Dynamic Background Effect */}
        <div className="absolute top-0 right-0 w-48 h-48 gold-gradient opacity-10 rounded-full blur-[60px] -mr-24 -mt-24 pointer-events-none group-hover:opacity-20 transition-all duration-1000" />

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-0.5 h-4 gold-gradient rounded-full shadow-gold-glow" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-500 group-hover:text-[#d4af37] transition-colors">
              {kpi.label}
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div className="text-2xl md:text-3xl font-light text-white tracking-tighter whitespace-nowrap mb-2 group-hover:translate-x-1 transition-transform duration-700 ease-out">
              {kpi.value}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isDark = variant === 'dark';

  return (
    <div
      className={`flex flex-col pl-4 border-l border-stone-800 transition-colors group h-full min-h-[120px] py-2 justify-center ${isDark ? 'hover:border-gold-start/50' : 'hover:border-gold-start/30 border-stone-200'}`}
    >
      <span
        className={`text-[9px] font-bold uppercase tracking-widest transition-colors mb-2 ${isDark ? 'text-stone-500 group-hover:text-[#d4af37]' : 'text-stone-400 group-hover:text-[#d4af37]'}`}
      >
        {kpi.label}
      </span>

      <div
        className={`text-2xl font-light my-1 tracking-tight whitespace-nowrap group-hover:translate-x-1 transition-transform duration-500 ${isDark ? 'text-white' : 'text-stone-900'}`}
      >
        {kpi.value}
      </div>
    </div>
  );
};
