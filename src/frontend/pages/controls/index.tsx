import React from 'react';
import { Cpu, MessageSquare, Rocket, Sliders, Shield } from 'lucide-react';

import {
  AppPage,
  AppCard,
  AppSection,
  FormField,
  AppBadge,
  AppKPICard,
  AppButton,
  AppSwitch,
} from '@/frontend/components/design-system';

import { api } from '@/backend/api';
import { usePageData } from '@/frontend/hooks/usePageData';
import { ControlEngine, ControlAddon } from '@/backend/types';

interface ControlsProps {
  searchTerm?: string;
}

export const Controls: React.FC<ControlsProps> = ({ searchTerm }) => {
  const { data, loading, error, retry } = usePageData<{
    toneOfVoice: string;
    languages: string[];
    formalityLevel: string;
    brandKeywords: string;
    engines: ControlEngine[];
    addons: ControlAddon[];
    intelligenceMode: 'Standard' | 'Advanced' | 'Pro' | 'Elite' | 'Max';
  }>(() => api.getControlsData());

  const filteredEngines = React.useMemo(() => {
    if (!data?.engines) return [];
    if (!searchTerm) return data.engines;
    const term = searchTerm.toLowerCase();
    return data.engines.filter(
      (e) => e.name.toLowerCase().includes(term) || e.summary.toLowerCase().includes(term)
    );
  }, [data?.engines, searchTerm]);

  const filteredAddons = React.useMemo(() => {
    if (!data?.addons) return [];
    if (!searchTerm) return data.addons;
    const term = searchTerm.toLowerCase();
    return data.addons.filter(
      (a) => a.name.toLowerCase().includes(term) || a.summary.toLowerCase().includes(term)
    );
  }, [data?.addons, searchTerm]);

  const stats = [
    {
      label: 'Active Engines',
      value: (data?.engines?.filter((e) => e.status === 'Active').length || 0).toString(),
      sub: 'Universal',
    },
    { label: 'Add-on Adoption', value: '0%', sub: 'No active usage' },
    { label: 'Memory Depth', value: '0%', sub: 'Context Pending' },
  ];

  return (
    <AppPage
      title="Controls"
      subtitle="Institutional orchestration parameters and engine configuration."
      loading={loading}
      error={error}
      onRetry={retry}
      actions={
        <AppButton variant="primary" icon={<Shield size={16} />}>
          Commit Changes
        </AppButton>
      }
    >
      <div className="space-y-12">
        {/* TOP STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <AppCard
              key={i}
              variant="light"
              padding="small"
              className="hover:border-gold-start/30 transition-all"
            >
              <AppKPICard
                variant="light"
                kpi={{
                  id: `stat-${i}`,
                  label: stat.label,
                  value: stat.value,
                  subtext: stat.sub,
                  trend: 0,
                  trendLabel: '',
                  status: 'neutral',
                }}
              />
            </AppCard>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* LEFT: AMELIA COMMUNICATION */}
          <div className="lg:col-span-1 space-y-8">
            <AppSection
              title="Amelia — Communication"
              subtitle="Define how the agent represents your institutional voice."
              icon={<MessageSquare size={18} className="text-stone-400" />}
            >
              <div className="space-y-6">
                <FormField
                  label="Tone preset"
                  placeholder="Professional & Warm"
                  value={data?.toneOfVoice || ''}
                  onChange={() => {}}
                />
                <FormField
                  label="Languages"
                  placeholder="English, Italian, Spanish"
                  value={data?.languages?.join(', ') || ''}
                  onChange={() => {}}
                />
                <FormField
                  label="Formality level"
                  placeholder="Medium"
                  value={data?.formalityLevel || ''}
                  onChange={() => {}}
                />
                <FormField
                  label="Brand keywords"
                  placeholder="Premium, Reliable, Direct"
                  value={data?.brandKeywords || ''}
                  onChange={() => {}}
                />
              </div>
            </AppSection>
          </div>

          {/* RIGHT: ENGINES */}
          <div className="lg:col-span-2 space-y-12">
            {/* UNIVERSAL ENGINES */}
            <AppSection
              title="Universal Engines"
              subtitle="Core autonomous processes running across all properties."
              icon={<Cpu size={18} className="text-stone-400" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEngines.map((engine: ControlEngine) => (
                  <AppCard
                    key={engine.id}
                    variant="light"
                    padding="none"
                    className="border border-stone-100 overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="font-bold text-sm text-stone-900">{engine.name}</div>
                        <AppSwitch checked={engine.status === 'Active'} onChange={() => {}} />
                      </div>
                      <p className="text-[10px] text-stone-500 leading-relaxed min-h-[30px]">
                        {engine.summary}
                      </p>
                    </div>
                    <div className="px-6 py-4 bg-stone-50 border-t border-stone-100">
                      <AppBadge variant={engine.status === 'Active' ? 'success' : 'neutral'}>
                        {engine.status}
                      </AppBadge>
                    </div>
                  </AppCard>
                ))}
              </div>
            </AppSection>

            {/* ADD-ON CATALOG */}
            <AppSection
              title="Add-on Catalog"
              subtitle="Managed services and upsells available for guest request."
              icon={<Rocket size={18} className="text-stone-400" />}
              action={
                <AppButton variant="outline" size="sm">
                  Add an add-on
                </AppButton>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {filteredAddons.map((addon: ControlAddon) => (
                  <AppCard
                    key={addon.id}
                    variant="light"
                    padding="small"
                    className="flex flex-col justify-between hover:border-gold-start/30 transition-all h-full"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-bold text-stone-900">{addon.name}</div>
                        <div className="text-[10px] font-mono text-gold-gradient font-bold">
                          {addon.price}
                        </div>
                      </div>
                      <p className="text-[10px] text-stone-500 leading-relaxed mb-4">
                        {addon.summary}
                      </p>
                    </div>
                  </AppCard>
                ))}
              </div>
            </AppSection>

            {/* INTELLIGENCE LEVEL */}
            <AppSection
              title="Intelligence Level"
              subtitle="Define the cognitive depth for autonomous decision making."
              icon={<Sliders size={18} className="text-stone-400" />}
            >
              <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-2xl w-fit">
                {['Standard', 'Advanced', 'Pro', 'Elite', 'Max'].map((level) => (
                  <button
                    key={level}
                    className={`
                      px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all
                      ${level === (data?.intelligenceMode || 'Pro') ? 'bg-stone-900 text-white shadow-premium' : 'text-stone-400 hover:text-stone-600'}
                    `}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </AppSection>
          </div>
        </div>
      </div>
    </AppPage>
  );
};

export default Controls;
