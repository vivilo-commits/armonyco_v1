import React from 'react';
import { MessageSquare, Rocket, Sliders, Shield, Search, Filter, MoreHorizontal, CheckCircle2 } from 'lucide-react';

import {
  AppPage,
  AppSection,
  FormField,
  AppBadge,
  AppButton,
  AppTable,
  AppTableRow,
  AppTableCell,
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

  // New states for Products section
  const [activeTab, setActiveTab] = React.useState<'standard' | 'custom'>('standard');
  const [productSearch, setProductSearch] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('ALL');

  const categories = ['ALL', 'GUEST', 'REVENUE', 'OPS', 'PLAYBOOK'];

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

  const allProducts = React.useMemo(() => {
    if (!data) return [];
    const engines = (data.engines || []).map(e => ({
      ...e,
      source: 'engine',
      category: e.type?.toUpperCase() || 'OPS',
      governance: 'Strict',
      productivity: 'High',
      humanTime: '0s',
      runtime: '1.2s',
      status: e.status === 'Active' ? 'Active' : 'Paused'
    }));
    const addons = (data.addons || []).map(a => ({
      ...a,
      source: 'addon',
      category: 'REVENUE',
      governance: 'Policy',
      productivity: 'Direct',
      humanTime: '5s',
      runtime: '0.8s',
      status: a.enabled ? 'Active' : 'Inactive'
    }));
    return [...engines, ...addons];
  }, [data]);

  const filteredProducts = React.useMemo(() => {
    return allProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.summary || '').toLowerCase().includes(productSearch.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchesTab = activeTab === 'standard'; // Currently all are considered standard in this mock-up logic
      return matchesSearch && matchesCategory && matchesTab;
    });
  }, [allProducts, productSearch, selectedCategory, activeTab]);

  const stats = React.useMemo(() => {
    const enabledAddons = data?.addons?.filter((a) => a.enabled).length || 0;
    const totalAddons = data?.addons?.length || 1;
    const addonAdoption = Math.round((enabledAddons / totalAddons) * 100);

    return [
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
      {
        label: 'System Status',
        value: 'Online',
        sub: 'Institutional-v4'
      },
    ];
  }, [data?.addons]);

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

            {/* RIGHT: PRODUCTS SECTION (Image 2) */}
            <div className="lg:col-span-2 space-y-8">
              <AppSection
                title="Products"
                subtitle="High-fidelity operational routines available for institutional scaling."
                icon={<Rocket size={18} className="text-gold-start" />}
              >
                <div className="space-y-6">
                  {/* Tabs & Search */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex bg-stone-100 p-1 rounded-xl w-fit">
                      {[
                        { label: 'Standard Products', value: 'standard' },
                        { label: 'Custom Products', value: 'custom' },
                      ].map((tab) => (
                        <button
                          key={tab.value}
                          onClick={() => setActiveTab(tab.value as any)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === tab.value
                            ? 'bg-white text-stone-900 shadow-sm'
                            : 'text-stone-500 hover:text-stone-700'
                            }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="relative group flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-gold-start transition-colors" size={16} />
                      <input
                        type="text"
                        placeholder="Search by product name or code..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-gold-start/20 focus:border-gold-start transition-all"
                      />
                    </div>
                  </div>

                  {/* Filter Chips */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <div className="flex items-center gap-2 text-stone-400 mr-2">
                      <Filter size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Filter:</span>
                    </div>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${selectedCategory === cat
                          ? 'bg-stone-900 border-stone-900 text-white'
                          : 'bg-white border-stone-200 text-stone-500 hover:border-stone-400'
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Main Table */}
                  <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                    <AppTable
                      headers={[
                        'Service Routine',
                        'Category',
                        'Governance',
                        'Productivity',
                        'Human Time',
                        'Runtime',
                        'Status',
                        'Actions'
                      ]}
                    >
                      {filteredProducts.map((p: any) => (
                        <AppTableRow key={p.id}>
                          <AppTableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-stone-50 flex items-center justify-center text-gold-start border border-stone-100">
                                {p.source === 'engine' ? <Sliders size={14} /> : <Rocket size={14} />}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-stone-900">{p.name}</span>
                                <span className="text-[10px] text-stone-500 font-mono">#{p.id.slice(0, 6).toUpperCase()}</span>
                              </div>
                            </div>
                          </AppTableCell>
                          <AppTableCell>
                            <AppBadge variant="neutral" size="sm">{p.category}</AppBadge>
                          </AppTableCell>
                          <AppTableCell>
                            <div className="flex items-center gap-1.5">
                              <Shield size={12} className="text-gold-start" />
                              <span className="text-[10px] font-bold text-stone-700">{p.governance}</span>
                            </div>
                          </AppTableCell>
                          <AppTableCell className="text-[10px] font-medium text-stone-600">
                            {p.productivity}
                          </AppTableCell>
                          <AppTableCell className="text-[10px] font-mono text-stone-500">
                            {p.humanTime}
                          </AppTableCell>
                          <AppTableCell className="text-[10px] font-mono text-stone-900 font-bold">
                            {p.runtime}
                          </AppTableCell>
                          <AppTableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'Active' ? 'bg-green-500 shadow-pulse-green' : 'bg-stone-300'}`} />
                              <span className="text-[10px] font-bold text-stone-700">{p.status}</span>
                            </div>
                          </AppTableCell>
                          <AppTableCell>
                            <div className="flex items-center gap-2">
                              <AppButton variant="secondary" size="sm" className="h-7 px-3 text-[10px]">
                                Config
                              </AppButton>
                              <button className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors text-stone-400">
                                <MoreHorizontal size={14} />
                              </button>
                            </div>
                          </AppTableCell>
                        </AppTableRow>
                      ))}
                    </AppTable>
                  </div>
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
                  <CheckCircle2 className="text-green-600" size={32} />
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
