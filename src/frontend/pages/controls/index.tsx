import React from 'react';
import {
    Activity,
    Shield,
    Globe,
    Scale,
    Search,
    Plus,
    MessageSquare,
    CheckCircle2,
    Zap,
    Cpu,
    Filter,
    Sliders,
    MoreHorizontal,
    Rocket
} from 'lucide-react';

import {
    AppPage,
    AppSection,
    FormField,
    AppBadge,
    AppButton,
    AppTable,
    AppTableRow,
    AppTableCell,
    AppCard,
} from '@/frontend/components/design-system';

import { api } from '@/backend/api';
import { usePageData } from '@/frontend/hooks/usePageData';
import { ControlEngine, ControlAddon } from '@/backend/types';
import { useAuth } from '../../contexts/AuthContext';
import { ALL_PRODUCTS } from '@/backend/product-catalog';
import { BaseModal } from '@/frontend/components/design-system/BaseModal';
import { ProductConfigModal } from '@/frontend/components/modals/ProductConfigModal';

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
        intelligenceMode: string;
        enableShadowMode: boolean;
        enableMultiLanguage: boolean;
        strictGovernance: boolean;
        autoUpsell: boolean;
        autoEarlyCheckin: boolean;
        autoLateCheckout: boolean;
        selfCorrection: boolean;
        engines: ControlEngine[];
        addons: ControlAddon[];
    }>(() => api.getControlsData());

    const [toneOfVoice, setToneOfVoice] = React.useState('');
    const [languages, setLanguages] = React.useState<string[]>([]);
    const [formalityLevel, setFormalityLevel] = React.useState('');
    const [brandKeywords, setBrandKeywords] = React.useState('');

    const [enableShadowMode, setEnableShadowMode] = React.useState(false);
    const [autoUpsell, setAutoUpsell] = React.useState(false);
    const [autoEarlyCheckin, setAutoEarlyCheckin] = React.useState(false);
    const [autoLateCheckout, setAutoLateCheckout] = React.useState(false);
    const [selfCorrection, setSelfCorrection] = React.useState(false);

    const [saving, setSaving] = React.useState(false);

    const [pendingAction, setPendingAction] = React.useState<{
        type: 'INTELLIGENCE' | 'CAPABILITY';
        target: string;
        label: string;
        newValue: any;
    } | null>(null);

    // New states for Products section
    const [activeTab, setActiveTab] = React.useState<'standard' | 'custom'>('standard');
    const [productSearch, setProductSearch] = React.useState('');
    const [selectedCategory, setSelectedCategory] = React.useState('ALL');
    const [showAddServiceModal, setShowAddServiceModal] = React.useState(false);
    const [newServiceName, setNewServiceName] = React.useState('');
    const [newServiceCategory, setNewServiceCategory] = React.useState('');
    const [selectedProductForConfig, setSelectedProductForConfig] = React.useState<any>(null);

    const categories = ['ALL', 'GUEST', 'REVENUE', 'OPS', 'PLAYBOOK', 'CUSTOM'];

    // Sync local state when data loads
    React.useEffect(() => {
        if (data) {
            setToneOfVoice(data.toneOfVoice || 'Professional & Warm');
            setLanguages(data.languages || ['English']);
            setFormalityLevel(data.formalityLevel || 'High');
            setBrandKeywords(data.brandKeywords || '');
            setEnableShadowMode(data.enableShadowMode);
            setAutoUpsell(data.autoUpsell);
            setAutoEarlyCheckin(data.autoEarlyCheckin);
            setAutoLateCheckout(data.autoLateCheckout);
            setSelfCorrection(data.selfCorrection);
        }
    }, [data]);

    const hasChanges = data && (
        toneOfVoice !== (data.toneOfVoice || 'Professional & Warm') ||
        JSON.stringify(languages) !== JSON.stringify(data.languages || ['English']) ||
        formalityLevel !== (data.formalityLevel || 'High') ||
        brandKeywords !== (data.brandKeywords || '') ||
        enableShadowMode !== data.enableShadowMode
    );

    const handleCommitChanges = async () => {
        setSaving(true);
        try {
            await api.updateGeneralSettings({
                tone_of_voice: toneOfVoice,
                languages: languages,
                formality_level: formalityLevel,
                brand_keywords: brandKeywords,
                enable_shadow_mode: enableShadowMode,
                // These are core features, should arguably always be true if the user tried to change them
                enable_multi_language: true,
                strict_governance: true
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
        return ALL_PRODUCTS.map(baseProduct => {
            const liveEngine = data?.engines?.find((e: ControlEngine) => e.name === baseProduct.name);
            const liveAddon = data?.addons?.find((a: ControlAddon) => a.name === baseProduct.name);

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

    const INTELLIGENCE_LEVELS = [
        { label: 'Guided', value: 'Standard', desc: 'Predictable workflows with high control.' },
        { label: 'Contextual', value: 'Advanced', desc: 'Situational awareness for complex guests.' },
        { label: 'Autonomous', value: 'Pro', desc: 'Independent decision making & logic execution.' },
        { label: 'Elite', value: 'Elite', desc: 'Advanced reasoning and multi-step orchestration.' },
        { label: 'Max', value: 'Max', desc: 'Maximum cognitive depth for institutional scale.' }
    ];

    const CAPABILITIES = [
        { label: 'Autonomous Upsell', id: 'autoUpsell', sub: 'Maximize transactional revenue', value: autoUpsell },
        { label: 'Self-Correction', id: 'selfCorrection', sub: 'Real-time failure recovery', value: selfCorrection },
        { label: 'Early Check-in', id: 'autoEarlyCheckin', sub: 'Capture arriving value', value: autoEarlyCheckin },
        { label: 'Late Check-out', id: 'autoLateCheckout', sub: 'Capture departing value', value: autoLateCheckout },
    ];

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
                <div className="space-y-6 pb-12">

                    {/* CONSOLIDATED ORCHESTRATION CARD */}
                    <AppCard variant="light" padding="none" className="p-6">
                        <div className="space-y-8">

                            {/* SECTION A: INSTITUTIONAL IDENTITY */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-gold-start/10 flex items-center justify-center">
                                            <Shield size={20} className="text-gold-start" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-stone-900 tracking-tight">System Identity</h3>
                                            <p className="text-xs text-stone-500 font-medium tracking-wide">Define your system's communication logic.</p>
                                        </div>
                                    </div>

                                    <div className="mt-8 space-y-6">
                                        <div>
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-3 block">Tone Preset</label>
                                            <select
                                                value={toneOfVoice}
                                                onChange={(e) => setToneOfVoice(e.target.value)}
                                                disabled={!canEdit}
                                                className="w-full bg-stone-50 border border-stone-200 rounded-[1.25rem] px-5 py-3.5 text-sm font-bold text-stone-900 focus:ring-2 focus:ring-gold-start/20 outline-none transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="Professional">Professional</option>
                                                <option value="Warm">Warm</option>
                                                <option value="Formal">Formal</option>
                                                <option value="Casual">Casual</option>
                                                <option value="Friendly">Friendly</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-3 block">Formality level</label>
                                            <div className="flex bg-stone-50 p-1.5 rounded-2xl border border-stone-100">
                                                {['Low', 'Medium', 'High'].map(lev => (
                                                    <button
                                                        key={lev}
                                                        onClick={() => setFormalityLevel(lev)}
                                                        disabled={!canEdit}
                                                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formalityLevel === lev
                                                            ? 'bg-white text-stone-900 shadow-sm border border-stone-100'
                                                            : 'text-stone-400 hover:text-stone-600'}`}
                                                    >
                                                        {lev}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-5 lg:border-l lg:border-r border-stone-100 lg:px-12">
                                    <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-6">Execution Languages</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {['English', 'Italian', 'Spanish', 'French', 'German', 'Portuguese'].map(lang => {
                                            const isActive = languages.includes(lang);
                                            return (
                                                <button
                                                    key={lang}
                                                    onClick={() => {
                                                        if (!canEdit) return;
                                                        const newLangs = isActive
                                                            ? languages.filter(l => l !== lang)
                                                            : [...languages, lang];
                                                        setLanguages(newLangs);
                                                    }}
                                                    className={`
                                                        px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all
                                                        ${isActive
                                                            ? 'bg-stone-900 border-stone-900 text-white shadow-premium'
                                                            : 'bg-white border-stone-100 text-stone-400 hover:border-stone-300'}
                                                    `}
                                                >
                                                    {lang}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <div className="mt-8">
                                        <FormField
                                            label="Brand Keywords"
                                            placeholder="e.g. Premium, Direct, Reliable"
                                            value={brandKeywords}
                                            onChange={(e) => setBrandKeywords(e.target.value)}
                                            disabled={!canEdit}
                                            className="bg-stone-50/50"
                                        />
                                    </div>
                                </div>

                                <div className="lg:col-span-3">
                                    <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-6">Core Guardrails</h4>
                                    <p className="text-[10px] text-stone-400 mb-4">Defines how strictly decisions are enforced.</p>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Multi-language', icon: <Globe size={14} /> },
                                            { label: 'Zero-Hallucination', icon: <Shield size={14} /> },
                                            { label: 'Strict Governance', icon: <Scale size={14} /> }
                                        ].map((g, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 bg-stone-50/50 rounded-xl border border-stone-100 border-dashed opacity-75">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-stone-600 uppercase tracking-widest">
                                                    {g.icon}
                                                    {g.label}
                                                </div>
                                                <div className="flex items-center gap-1.5 font-bold text-[8px] text-green-600 uppercase tracking-widest bg-green-50 px-2 py-1 rounded-full border border-green-100">
                                                    <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                                                    Locked
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="h-px w-full bg-gradient-to-r from-transparent via-stone-100 to-transparent" />

                            {/* SECTION B: DECISION INTELLIGENCE */}
                            <div>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-xl bg-gold-start/10 flex items-center justify-center">
                                        <Cpu size={20} className="text-gold-start" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-stone-900 tracking-tight">Decision Depth</h3>
                                        <p className="text-xs text-stone-500 font-medium tracking-wide">Configure the cognitive autonomy of the orchestration engine.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-5">
                                    {INTELLIGENCE_LEVELS.map((level, idx) => {
                                        const isActive = level.value === (data?.intelligenceMode || 'Pro');
                                        return (
                                            <button
                                                key={level.value}
                                                disabled={!canEdit || isActive}
                                                onClick={() => {
                                                    setPendingAction({
                                                        type: 'INTELLIGENCE',
                                                        target: 'intelligenceMode',
                                                        label: level.label,
                                                        newValue: level.value
                                                    });
                                                }}
                                                className={`
                                                    relative p-5 rounded-2xl border text-left transition-all duration-500 group overflow-hidden h-full
                                                    ${isActive
                                                        ? 'bg-stone-900 border-stone-900 shadow-gold-glow-large scale-[1.02]'
                                                        : 'bg-white border-stone-100 hover:border-gold-start/30 hover:shadow-xl'}
                                                `}
                                            >
                                                {isActive && (
                                                    <div className="absolute top-0 right-0 w-32 h-32 gold-gradient opacity-10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                                                )}

                                                <div className="flex flex-col h-full justify-between">
                                                    <div>
                                                        <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 transition-colors ${isActive ? 'text-gold-start' : 'text-stone-400 group-hover:text-stone-900'}`}>
                                                            Level 0{idx + 1}
                                                        </div>
                                                        <div className={`text-xl font-black mb-3 tracking-tighter ${isActive ? 'text-white' : 'text-stone-900'}`}>
                                                            {level.label}
                                                        </div>
                                                        <p className={`text-[10px] font-medium leading-relaxed ${isActive ? 'text-stone-400' : 'text-stone-400 group-hover:text-stone-500'}`}>
                                                            {level.desc}
                                                        </p>
                                                    </div>
                                                    <div className="mt-4 flex items-center justify-between">
                                                        <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-gold-start shadow-pulse-gold' : 'bg-stone-100'}`} />
                                                        {isActive && (
                                                            <div className="text-[10px] font-black text-gold-start uppercase tracking-widest italic animate-pulse">Running</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="h-px w-full bg-gradient-to-r from-transparent via-stone-100 to-transparent" />

                            {/* SECTION C: COGNITIVE CAPABILITIES */}
                            <div>
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-xl bg-gold-start/10 flex items-center justify-center">
                                        <Zap size={20} className="text-gold-start" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-stone-900 tracking-tight">Cognitive Capabilities (AIM)</h3>
                                        <p className="text-xs text-stone-500 font-medium tracking-wide">Specific autonomous routines allowed for system execution.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {CAPABILITIES.map((cap) => {
                                        const isActive = cap.value;
                                        return (
                                            <button
                                                key={cap.id}
                                                onClick={() => {
                                                    setPendingAction({
                                                        type: 'CAPABILITY',
                                                        target: cap.id,
                                                        label: cap.label,
                                                        newValue: !cap.value
                                                    });
                                                }}
                                                disabled={!canEdit}
                                                className={`
                                                    relative p-5 rounded-2xl border text-left transition-all duration-500 group overflow-hidden
                                                    ${isActive
                                                        ? 'bg-stone-900 border-stone-900 shadow-premium'
                                                        : 'bg-stone-50/50 border-stone-100 hover:bg-white hover:border-gold-start/20 hover:shadow-xl'}
                                                `}
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isActive ? 'bg-white/10 text-gold-start rotate-12 shadow-gold-glow' : 'bg-white text-stone-400'}`}>
                                                        <Zap size={20} strokeWidth={1.5} />
                                                    </div>
                                                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 shadow-pulse-green' : 'bg-stone-200'}`} />
                                                </div>

                                                <div className={`text-sm font-black uppercase tracking-[0.1em] mb-2 ${isActive ? 'text-white' : 'text-stone-800'}`}>
                                                    {cap.label}
                                                </div>
                                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                                    {cap.sub}
                                                </p>

                                                {isActive && (
                                                    <div className="absolute -bottom-2 -right-2 opacity-5 scale-150 rotate-12">
                                                        <Shield size={120} />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </AppCard>

                    {/* ROUTINE ORCHESTRATION SECTION */}
                    <AppSection
                        title="Routine Orchestration (AEM)"
                        subtitle="High-fidelity operational routines available for institutional scaling."
                        icon={<Activity size={18} className="text-gold-start" />}
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
                                            placeholder="Search product catalog..."
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                            className="w-full bg-stone-50/50 border border-stone-100 rounded-[1.25rem] py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold-start/20 placeholder:text-stone-400 shadow-sm transition-all font-medium"
                                        />
                                    </div>
                                    <AppButton
                                        variant="primary"
                                        icon={<Plus size={16} />}
                                        onClick={() => setShowAddServiceModal(true)}
                                        className="rounded-full px-8 whitespace-nowrap h-12"
                                    >
                                        Add Service
                                    </AppButton>
                                </div>
                            </div>

                            {/* Filter Chips */}
                            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                <div className="flex items-center gap-2 text-stone-400 mr-2 shrink-0">
                                    <Filter size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Logic Filters:</span>
                                </div>
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border shrink-0 ${selectedCategory === cat
                                            ? 'bg-stone-900 border-stone-900 text-white shadow-md'
                                            : 'bg-white border-stone-200 text-stone-400 hover:border-stone-400'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            {/* Master Table */}
                            <div className="bg-white rounded-[3rem] border border-stone-200 overflow-hidden shadow-premium">
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
                                                <div className="flex items-center gap-4 py-2">
                                                    <div className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center text-gold-start border border-stone-100 shadow-sm transition-transform group-hover:scale-110 duration-500">
                                                        {p.type === 'standard' ? <Sliders size={20} strokeWidth={1.5} /> : <Rocket size={20} strokeWidth={1.5} />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-stone-900 tracking-tight">{p.name}</span>
                                                        <span className="text-[10px] text-stone-400 font-mono tracking-tighter uppercase font-bold">ARC-ORCH-{p.id}</span>
                                                    </div>
                                                </div>
                                            </AppTableCell>
                                            <AppTableCell>
                                                <AppBadge variant="neutral" size="sm" className="bg-stone-50 border-stone-100 text-[9px] uppercase tracking-widest font-black">{p.category}</AppBadge>
                                            </AppTableCell>
                                            <AppTableCell>
                                                <div className="flex items-center gap-1.5">
                                                    <Shield size={12} className="text-gold-start" strokeWidth={3} />
                                                    <span className="text-[10px] font-black text-stone-900 uppercase tracking-widest">{p.governance}</span>
                                                </div>
                                            </AppTableCell>
                                            <AppTableCell className="text-[10px] font-black text-stone-400 uppercase tracking-[0.1em]">
                                                {p.productivity}
                                            </AppTableCell>
                                            <AppTableCell className="text-[10px] font-mono text-stone-400 border-l border-stone-50 pl-6">
                                                {p.humanTime}
                                            </AppTableCell>
                                            <AppTableCell className="text-[10px] font-mono text-stone-900 font-black">
                                                {p.runtime}
                                            </AppTableCell>
                                            <AppTableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${p.status === 'Active' ? 'bg-green-500 shadow-pulse-green' : 'bg-stone-200'}`} />
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${p.status === 'Active' ? 'text-stone-900' : 'text-stone-400'}`}>{p.status}</span>
                                                </div>
                                            </AppTableCell>
                                            <AppTableCell>
                                                <div className="flex items-center gap-3">
                                                    <AppButton
                                                        variant="secondary"
                                                        size="sm"
                                                        className="h-10 px-8 text-[10px] font-black uppercase tracking-widest rounded-2xl border-stone-200 hover:bg-stone-50 transition-all font-mono"
                                                        onClick={() => setSelectedProductForConfig(p)}
                                                    >
                                                        Config
                                                    </AppButton>
                                                    <button className="p-2.5 hover:bg-stone-50 rounded-2xl transition-all text-stone-300 hover:text-stone-600">
                                                        <MoreHorizontal size={20} />
                                                    </button>
                                                </div>
                                            </AppTableCell>
                                        </AppTableRow>
                                    ))}
                                </AppTable>
                                {filteredProducts.length === 0 && (
                                    <div className="p-20 text-center bg-white border-t border-stone-100/50">
                                        <div className="flex flex-col items-center gap-4">
                                            <Search size={48} className="text-stone-100" />
                                            <h4 className="text-stone-900 font-bold tracking-tight">No routines found</h4>
                                            <p className="text-stone-500 text-xs max-w-xs mx-auto">No results matching your current filters. Adjust your search or try another category.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </AppSection>
                </div>

                <ProductConfigModal
                    isOpen={!!selectedProductForConfig}
                    onClose={() => setSelectedProductForConfig(null)}
                    product={selectedProductForConfig}
                    onSave={(config) => {
                        console.log('Saving config for', selectedProductForConfig?.name, config);
                        setShowSaveModal(true);
                    }}
                />

                {/* MODALS */}
                <BaseModal
                    isOpen={showAddServiceModal}
                    onClose={() => setShowAddServiceModal(false)}
                    title="Provision Routine"
                    subtitle="Deploy new operational capabilities to your institution."
                    icon={<Plus size={24} />}
                >
                    <div className="space-y-6 pt-4">
                        <FormField
                            label="Routine Name"
                            placeholder="e.g., Luxury Spa Orchestration"
                            value={newServiceName}
                            onChange={(e) => setNewServiceName(e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Primary Category</label>
                                <select
                                    value={newServiceCategory}
                                    onChange={(e) => setNewServiceCategory(e.target.value)}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-gold-start/20 outline-none"
                                >
                                    {categories.filter(c => c !== 'ALL').map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <FormField
                                label="Initial Governance"
                                value="Human Controlled"
                                onChange={() => { }}
                                disabled
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-6 border-t border-stone-100">
                            <AppButton variant="secondary" onClick={() => setShowAddServiceModal(false)}>
                                Cancel
                            </AppButton>
                            <AppButton variant="primary" onClick={() => {
                                setShowAddServiceModal(false);
                                setShowSaveModal(true);
                                setNewServiceName('');
                                setNewServiceCategory('');
                            }}>
                                Deploy Service
                            </AppButton>
                        </div>
                    </div>
                </BaseModal>

                <BaseModal
                    isOpen={showSaveModal}
                    onClose={() => setShowSaveModal(false)}
                    title="Changes Published"
                    subtitle="Institutional control parameters successfully committed to the cognitive layer."
                    icon={<CheckCircle2 className="text-green-600" size={32} />}
                >
                    <div className="pt-4 text-center">
                        <AppButton
                            variant="primary"
                            className="w-full h-12 rounded-2xl"
                            onClick={() => setShowSaveModal(false)}
                        >
                            Continue Orchestration
                        </AppButton>
                    </div>
                </BaseModal>

                <BaseModal
                    isOpen={!!pendingAction}
                    onClose={() => setPendingAction(null)}
                    title="Confirm Parameter Change"
                    subtitle="This action will modify the live orchestration engine logic."
                    icon={<Activity size={24} className="text-gold-start" />}
                >
                    <div className="space-y-8 pt-4">
                        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 gold-gradient opacity-10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:opacity-20 transition-all duration-700 pointer-events-none" />

                            <div className="flex items-start gap-4 relative z-10">
                                <div className="p-3 bg-white/10 rounded-2xl text-gold-start">
                                    <Shield size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gold-start uppercase tracking-[0.2em] mb-2">Institutional Impact Warning</p>
                                    <p className="text-xs text-stone-400 leading-relaxed font-medium">
                                        Changing <strong className="text-white px-1.5 py-0.5 bg-stone-800 rounded-md">{pendingAction?.label}</strong> will immediately affect how the system handles live guest interactions.
                                        {pendingAction?.type === 'INTELLIGENCE' && ' This will alter the foundational autonomy level of all active agents globally.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <button
                                onClick={() => setPendingAction(null)}
                                className="px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors"
                            >
                                Abort
                            </button>
                            <AppButton
                                variant="primary"
                                className="h-12 px-10 rounded-2xl shadow-gold-glow"
                                onClick={async () => {
                                    if (!pendingAction) return;

                                    if (pendingAction.type === 'INTELLIGENCE') {
                                        try {
                                            await api.updateIntelligenceMode(pendingAction.newValue);
                                            retry();
                                        } catch (e) {
                                            console.error('Failed', e);
                                            alert('Failed to update intelligence mode');
                                        }
                                    } else {
                                        // Update local state for capabilities (and then commit via Commit Changes)
                                        switch (pendingAction.target) {
                                            case 'autoUpsell': setAutoUpsell(pendingAction.newValue); break;
                                            case 'selfCorrection': setSelfCorrection(pendingAction.newValue); break;
                                            case 'autoEarlyCheckin': setAutoEarlyCheckin(pendingAction.newValue); break;
                                            case 'autoLateCheckout': setAutoLateCheckout(pendingAction.newValue); break;
                                        }
                                    }
                                    setPendingAction(null);
                                }}
                            >
                                Confirm & Publish
                            </AppButton>
                        </div>
                    </div>
                </BaseModal>
            </AppPage>
        </>
    );
};

export default Controls;
