import React from 'react';
import { Cpu, MessageSquare, Rocket, Sliders, Shield } from 'lucide-react';

import {
  AppPage,
  AppSection,
  FormField,
  AppBadge,
  AppButton,
  AppSwitch,
} from '@/frontend/components/design-system';

import { api } from '@/backend/api';
import { usePageData } from '@/frontend/hooks/usePageData';
import { ControlEngine, ControlAddon } from '@/backend/types';
import { useAuth } from '../../contexts/AuthContext';

interface ControlsProps {
  searchTerm?: string;
}

export const Controls: React.FC<ControlsProps> = ({ searchTerm }) => {
  const { canEdit } = useAuth();
  const [showSaveModal, setShowSaveModal] = React.useState(false);
  const { data, loading, error, retry } = usePageData<{
    toneOfVoice: string;
    languages: string[];
    formalityLevel: string;
    brandKeywords: string;
    engines: ControlEngine[];
    addons: ControlAddon[];
    intelligenceMode: 'Standard' | 'Advanced' | 'Pro' | 'Elite' | 'Max';
  }>(() => api.getControlsData());

  const [toneOfVoice, setToneOfVoice] = React.useState('');
  const [languages, setLanguages] = React.useState('');
  const [formalityLevel, setFormalityLevel] = React.useState('');
  const [brandKeywords, setBrandKeywords] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  // Sync local state when data loads
  React.useEffect(() => {
    if (data) {
      setToneOfVoice(data.toneOfVoice || '');
      setLanguages(data.languages?.join(', ') || '');
      setFormalityLevel(data.formalityLevel || '');
      setBrandKeywords(data.brandKeywords || '');
    }
  }, [data]);

  const hasChanges = data && (
    toneOfVoice !== (data.toneOfVoice || '') ||
    languages !== (data.languages?.join(', ') || '') ||
    formalityLevel !== (data.formalityLevel || '') ||
    brandKeywords !== (data.brandKeywords || '')
  );

  const handleCommitChanges = async () => {
    setSaving(true);
    try {
      await api.updateGeneralSettings({
        tone_of_voice: toneOfVoice,
        languages: languages.split(',').map(l => l.trim()).filter(Boolean),
        formality_level: formalityLevel,
        brand_keywords: brandKeywords
      });
      setShowSaveModal(true);
      retry();
    } catch (e) {
      console.error('Failed to commit changes:', e);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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

  const stats = React.useMemo(() => {
    const activeEngines = data?.engines?.filter((e) => e.status === 'Active').length || 0;
    const totalEngines = data?.engines?.length || 1;

    const enabledAddons = data?.addons?.filter((a) => a.enabled).length || 0;
    const totalAddons = data?.addons?.length || 1;
    const addonAdoption = Math.round((enabledAddons / totalAddons) * 100);

    return [
      {
        label: 'Active Engines',
        value: activeEngines.toString(),
        sub: `${totalEngines} Universal`,
      },
      {
        label: 'Add-on Adoption',
        value: `${addonAdoption}%`,
        sub: `${enabledAddons}/${totalAddons} enabled`
      },
      {
        label: 'Memory Depth',
        value: '15 msgs',
        sub: 'Context window'
      },
    ];
  }, [data?.engines, data?.addons]);

  return (
    <>
      <AppPage
        title="Controls"
        subtitle="Institutional orchestration parameters and engine configuration."
        loading={loading}
        error={error}
        onRetry={retry}
        actions={
          <AppButton
            variant="primary"
            icon={<Shield size={16} />}
            onClick={handleCommitChanges}
            disabled={!canEdit || !hasChanges || saving}
            loading={saving}
          >
            Commit Changes
          </AppButton>
        }
      >
        <div className="space-y-12">
          {/* TOP STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="bg-white/40 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:border-gold-start/40 hover:shadow-premium transition-all duration-300 group"
              >
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2 group-hover:text-gold-start transition-colors">
                  {stat.label}
                </div>
                <div className="text-3xl font-black text-stone-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-[10px] text-stone-500">
                  {stat.sub}
                </div>
              </div>
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
                    value={toneOfVoice}
                    onChange={(e) => setToneOfVoice(e.target.value)}
                    disabled={!canEdit}
                  />
                  <FormField
                    label="Languages"
                    placeholder="English, Italian, Spanish"
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    disabled={!canEdit}
                  />
                  <FormField
                    label="Formality level"
                    placeholder="Medium"
                    value={formalityLevel}
                    onChange={(e) => setFormalityLevel(e.target.value)}
                    disabled={!canEdit}
                  />
                  <FormField
                    label="Brand keywords"
                    placeholder="Premium, Reliable, Direct"
                    value={brandKeywords}
                    onChange={(e) => setBrandKeywords(e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
              </AppSection>

              {/* INTELLIGENCE LEVEL */}
              <AppSection
                title="Intelligence Level"
                subtitle="Define the cognitive depth for autonomous decision making."
                icon={<Sliders size={18} className="text-stone-400" />}
              >
                <div className="flex flex-wrap items-center gap-2 bg-stone-100 p-1.5 rounded-2xl">
                  {['Standard', 'Advanced', 'Pro', 'Elite', 'Max'].map((level) => (
                    <button
                      key={level}
                      disabled={!canEdit}
                      onClick={async () => {
                        if (data?.intelligenceMode === level) return;
                        try {
                          await api.updateIntelligenceMode(level);
                          retry();
                        } catch (e) {
                          console.error('Failed to update intelligence mode:', e);
                        }
                      }}
                      className={`
                        px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all
                        ${level === (data?.intelligenceMode || 'Pro') ? 'bg-stone-900 text-white shadow-premium' : 'text-stone-400 hover:text-stone-600'}
                        ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {level}
                    </button>
                  ))}
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
                    <div
                      key={engine.id}
                      className="bg-white/60 backdrop-blur-md border border-white/30 rounded-2xl overflow-hidden hover:border-gold-start/30 hover:shadow-premium transition-all duration-300 group"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="font-bold text-sm text-stone-900 group-hover:text-gold-start transition-colors">{engine.name}</div>
                          <AppSwitch
                            disabled={!canEdit}
                            checked={engine.status === 'Active'}
                            onChange={async (checked) => {
                              try {
                                await api.updateEngineStatus(engine.id, checked ? 'Active' : 'Paused');
                                retry();
                              } catch (e) {
                                console.error('Failed to update engine status:', e);
                              }
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-stone-500 leading-relaxed min-h-[30px]">
                          {engine.summary}
                        </p>
                      </div>
                      <div className="px-6 py-4 bg-white/40 border-t border-white/20">
                        <AppBadge variant={engine.status === 'Active' ? 'success' : 'neutral'}>
                          {engine.status}
                        </AppBadge>
                      </div>
                    </div>
                  ))}
                </div>
              </AppSection>

              {/* ADD-ON CATALOG */}
              <AppSection
                title="Add-on Catalog"
                subtitle="Managed services and upsells available for guest request."
                icon={<Rocket size={18} className="text-stone-400" />}
                action={
                  canEdit && (
                    <AppButton variant="outline" size="sm">
                      Add an add-on
                    </AppButton>
                  )
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {filteredAddons.map((addon: ControlAddon) => (
                    <div
                      key={addon.id}
                      className={`bg-white/50 backdrop-blur-lg border border-white/25 rounded-2xl p-5 hover:border-gold-start/40 hover:shadow-premium transition-all duration-300 group flex flex-col justify-between h-full ${canEdit ? 'cursor-pointer' : 'cursor-default opacity-80'}`}
                      onClick={async () => {
                        if (!canEdit) return;
                        try {
                          await api.updateAddonStatus(addon.id, !addon.enabled);
                          retry();
                        } catch (e) {
                          console.error('Failed to update addon status:', e);
                        }
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-bold text-stone-900 group-hover:text-gold-start transition-colors">{addon.name}</div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${addon.enabled ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-stone-300'}`} />
                            <div className="text-[10px] font-mono gold-gradient font-bold">
                              {addon.price}
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-stone-500 leading-relaxed mb-4">
                          {addon.summary}
                        </p>
                        <div className="flex justify-end">
                          <AppBadge variant={addon.enabled ? 'success' : 'neutral'} size="sm">
                            {addon.enabled ? 'Active' : 'Enable'}
                          </AppBadge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AppSection>
            </div>
          </div>
        </div>
      </AppPage>

      {/* COMMIT CHANGES MODAL */}
      {
        showSaveModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowSaveModal(false)}>
            <div className="bg-white rounded-3xl p-8 max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Shield className="text-green-600" size={32} />
                </div>
                <h3 className="text-xl font-bold text-stone-900">Changes Saved</h3>
                <p className="text-sm text-stone-600">
                  Your institutional control parameters have been successfully committed.
                </p>
                <AppButton
                  variant="primary"
                  className="w-full"
                  onClick={() => setShowSaveModal(false)}
                >
                  Continue
                </AppButton>
              </div>
            </div>
          </div>
        )
      }
    </>
  );
};

export default Controls;
