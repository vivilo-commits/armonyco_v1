import React from 'react';
import { MessageSquare, Rocket, Sliders, Shield, Search, Filter, MoreHorizontal, CheckCircle2, Plus, Activity } from 'lucide-react';

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
import { ALL_PRODUCTS } from '@/backend/product-catalog';
import { BaseModal } from '@/frontend/components/design-system/BaseModal';

interface ControlsProps {
}

export const Controls: React.FC<ControlsProps> = () => {
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
  const [showAddServiceModal, setShowAddServiceModal] = React.useState(false);
  const [newServiceName, setNewServiceName] = React.useState('');
  const [newServiceCategory, setNewServiceCategory] = React.useState('');

  const categories = ['ALL', 'GUEST', 'REVENUE', 'OPS', 'PLAYBOOK', 'CUSTOM'];

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
    // Merge live engine/addon status with the base product catalog
    return ALL_PRODUCTS.map(baseProduct => {
      const liveEngine = data?.engines?.find(e => e.name === baseProduct.name);
      const liveAddon = data?.addons?.find(a => a.name === baseProduct.name);

      let status = 'Paused';
      if (liveEngine) status = liveEngine.status === 'Active' ? 'Active' : 'Paused';
      if (liveAddon) status = liveAddon.enabled ? 'Active' : 'Inactive';

      return {
        ...baseProduct,
        status: status as 'Active' | 'Paused' | 'Inactive'
      };
    });
  }, [data]);

  const filteredProducts = React.useMemo(() => {
    return allProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchesTab = activeTab === p.type;
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
        <div className="space-y-12 pb-12">
          {/* HORIZON: 3 KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="bg-white/40 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-10 hover:border-gold-start/40 hover:shadow-premium transition-all duration-300 group shadow-sm"
              >
                <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3 group-hover:text-gold-start transition-colors">
                  {stat.label}
                </div>
                <div className="text-4xl font-black text-stone-900 mb-2 tracking-tighter">
                  {stat.value}
                </div>
                <div className="text-[10px] text-stone-400 font-medium">
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>

          {/* CUSTOMIZE SECTION: Communication & Intelligence */}
          <AppSection
            title="Customize"
            subtitle="Configure your institutional persona and decision-making depth."
            icon={<MessageSquare size={18} className="text-stone-400" />}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-8">
              {/* Left Side: Amelia Fields */}
              <div className="lg:col-span-7 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Formality level"
                    placeholder="High"
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
              </div>

              {/* Right Side: Intelligence Selector */}
              <div className="lg:col-span-5">
                <div className="mb-6">
                  <h3 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={14} className="text-gold-start" /> Intelligence Level
                  </h3>
                  <p className="text-[10px] text-stone-500 mt-1 italic">Cognitive depth for autonomous decisions.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {['Standard', 'Advanced', 'Pro', 'Elite', 'Max'].map((level) => {
                    const isActive = level === (data?.intelligenceMode || 'Pro');
                    return (
                      <button
                        key={level}
                        disabled={!canEdit}
                        onClick={async () => {
                          if (isActive) return;
                          try {
                            await api.updateIntelligenceMode(level);
                            retry();
                          } catch (e) {
                            console.error('Failed to update intelligence mode:', e);
                          }
                        }}
                        className={`
                          group relative p-4 rounded-[1.5rem] border transition-all duration-300 text-left
                          ${isActive
                            ? 'bg-stone-900 border-stone-900 text-white shadow-premium ring-4 ring-gold-start/10'
                            : 'bg-white/40 backdrop-blur-sm border-stone-100/50 text-stone-400 hover:border-gold-start/30 hover:bg-white'}
                          ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <div className={`text-[10px] font-black uppercase tracking-tighter mb-1 transition-colors ${isActive ? 'text-gold-start' : 'group-hover:text-stone-900'}`}>
                          {level}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-gold-start shadow-pulse-gold' : 'bg-stone-200 group-hover:bg-stone-400'}`} />
                          <div className={`text-[8px] font-bold ${isActive ? 'text-white/40' : 'text-stone-300'}`}>
                            LVL {['Standard', 'Advanced', 'Pro', 'Elite', 'Max'].indexOf(level) + 1}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </AppSection>

          {/* PRODUCTS SECTION: Catalog & Search */}
          <AppSection
            title="Products"
            subtitle="High-fidelity operational routines available for institutional scaling."
            icon={<Rocket size={18} className="text-gold-start" />}
          >
            <div className="space-y-8 mt-8">
              {/* Controls Row */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex bg-stone-100/50 p-1.5 rounded-2xl w-fit">
                  {[
                    { label: 'Standard Products', value: 'standard' },
                    { label: 'Custom Products', value: 'custom' },
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => setActiveTab(tab.value as any)}
                      className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.value
                        ? 'bg-white text-stone-900 shadow-sm'
                        : 'text-stone-500 hover:text-stone-700'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4 flex-1 max-w-2xl">
                  <div className="relative group flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-gold-start transition-colors" size={18} />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full bg-stone-50/50 border border-stone-100 rounded-[1.25rem] py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold-start/20 placeholder:text-stone-400 shadow-sm transition-all"
                    />
                  </div>
                  <AppButton
                    variant="primary"
                    icon={<Plus size={16} />}
                    onClick={() => setShowAddServiceModal(true)}
                    className="rounded-full px-6 whitespace-nowrap"
                  >
                    Add Service
                  </AppButton>
                </div>
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <div className="flex items-center gap-2 text-stone-400 mr-2 shrink-0">
                  <Filter size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Filter:</span>
                </div>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2 rounded-full text-[10px] font-bold transition-all border shrink-0 ${selectedCategory === cat
                      ? 'bg-stone-900 border-stone-900 text-white shadow-md'
                      : 'bg-white border-stone-200 text-stone-400 hover:border-stone-400'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Master Table */}
              <div className="bg-white rounded-[3rem] border border-stone-100 overflow-hidden shadow-premium">
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
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center text-gold-start border border-stone-100 shadow-sm group-hover:scale-105 transition-transform">
                            {p.type === 'standard' ? <Sliders size={18} strokeWidth={1.5} /> : <Rocket size={18} strokeWidth={1.5} />}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-stone-900">{p.name}</span>
                            <span className="text-[10px] text-stone-400 font-mono tracking-tighter uppercase">ID #{p.id}</span>
                          </div>
                        </div>
                      </AppTableCell>
                      <AppTableCell>
                        <AppBadge variant="neutral" size="sm" className="bg-stone-50 border-stone-100 text-[9px] uppercase tracking-widest font-bold">{p.category}</AppBadge>
                      </AppTableCell>
                      <AppTableCell>
                        <div className="flex items-center gap-1.5">
                          <Shield size={12} className="text-gold-start" strokeWidth={2.5} />
                          <span className="text-[10px] font-bold text-stone-900 uppercase tracking-wider">{p.governance}</span>
                        </div>
                      </AppTableCell>
                      <AppTableCell className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        {p.productivity}
                      </AppTableCell>
                      <AppTableCell className="text-[10px] font-mono text-stone-400 border-l border-stone-50 pl-4">
                        {p.humanTime}
                      </AppTableCell>
                      <AppTableCell className="text-[10px] font-mono text-stone-900 font-bold">
                        {p.runtime}
                      </AppTableCell>
                      <AppTableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${p.status === 'Active' ? 'bg-green-500 shadow-pulse-green' : 'bg-stone-200'}`} />
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${p.status === 'Active' ? 'text-stone-900' : 'text-stone-400'}`}>{p.status}</span>
                        </div>
                      </AppTableCell>
                      <AppTableCell>
                        <div className="flex items-center gap-2">
                          <AppButton variant="secondary" size="sm" className="h-9 px-5 text-[10px] font-bold uppercase tracking-widest rounded-xl border-stone-200 hover:bg-stone-50">
                            Config
                          </AppButton>
                          <button className="p-2 hover:bg-stone-50 rounded-xl transition-colors text-stone-300 hover:text-stone-600">
                            <MoreHorizontal size={18} />
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
      </AppPage>

      {/* MODALS */}
      <BaseModal
        isOpen={showAddServiceModal}
        onClose={() => setShowAddServiceModal(false)}
        title="Add Extra Service"
        subtitle="Provision new operational routines for your institution."
        icon={<Plus size={20} />}
      >
        <div className="space-y-6 pt-4">
          <FormField
            label="Service Name"
            placeholder="e.g., Luxury Spa Booking"
            value={newServiceName}
            onChange={(e) => setNewServiceName(e.target.value)}
          />
          <FormField
            label="Category"
            placeholder="e.g., CUSTOM, OPS"
            value={newServiceCategory}
            onChange={(e) => setNewServiceCategory(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label="Productivity"
              placeholder="e.g., Premium"
              value="Premium"
              onChange={() => { }}
            />
            <FormField
              label="Governance"
              placeholder="e.g., Human"
              value="Human"
              onChange={() => { }}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <AppButton variant="secondary" onClick={() => setShowAddServiceModal(false)}>
              Cancel
            </AppButton>
            <AppButton variant="primary" onClick={() => {
              setShowAddServiceModal(false);
              setShowSaveModal(true);
              setNewServiceName('');
              setNewServiceCategory('');
            }}>
              Add Service
            </AppButton>
          </div>
        </div>
      </BaseModal>

      <BaseModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="Changes Saved"
        subtitle="Your institutional control parameters have been successfully committed."
        icon={<CheckCircle2 className="text-green-600" size={24} />}
      >
        <div className="pt-4 text-center">
          <AppButton
            variant="primary"
            className="w-full"
            onClick={() => setShowSaveModal(false)}
          >
            Continue
          </AppButton>
        </div>
      </BaseModal>
    </>
  );
};

export default Controls;
