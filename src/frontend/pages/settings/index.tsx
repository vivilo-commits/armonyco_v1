import React, { useState, useEffect } from 'react';
import {
  User,
  Building2,
  Zap,
  CreditCard,
  Check,
  Upload,
  Users,
  Phone,
  FileText,
  Crown,
  Mail,
  MapPin,
} from 'lucide-react';

import {
  AppPage,
  AppCard,
  AppButton,
  AppSection,
  AppBadge,
  FormField,
} from '@/frontend/components/design-system';
import { ConfigureWhatsAppModal } from '@/frontend/components/modals/ConfigureWhatsAppModal';
import { ConfigurePMSModal } from '@/frontend/components/modals/ConfigurePMSModal';
import { UploadKnowledgeModal } from '@/frontend/components/modals/UploadKnowledgeModal';

import { api } from '@/backend/api';
import { usePageData } from '@/frontend/hooks/usePageData';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '@/database/supabase';

type SettingsTab = 'IDENTITY' | 'ORGANIZATION' | 'SYSTEM_ACTIVATION' | 'SUBSCRIPTION';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('IDENTITY');
  const { loading, error, retry } = usePageData(() => api.getSettingsData());
  const { profile, organization, entitlements, refreshProfile } = useAuth();

  // Modal states
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [pmsModalOpen, setPmsModalOpen] = useState(false);
  const [knowledgeModalOpen, setKnowledgeModalOpen] = useState(false);

  // Editable fields - Identity
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('en');
  const [aiTone, setAiTone] = useState('professional');

  // Editable fields - Organization
  const [companyName, setCompanyName] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [billingStreet, setBillingStreet] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingPostal, setBillingPostal] = useState('');
  const [billingCountry, setBillingCountry] = useState('IT');

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Auto Top-up settings
  const [autoTopupEnabled, setAutoTopupEnabled] = useState(false);
  const [autoTopupThreshold, setAutoTopupThreshold] = useState(10);
  const [autoTopupAmount, setAutoTopupAmount] = useState(50);

  useEffect(() => {
    if (entitlements) {
      setAutoTopupEnabled(!!entitlements.auto_topup_enabled);
      setAutoTopupThreshold(entitlements.auto_topup_threshold || 10);
      setAutoTopupAmount(entitlements.auto_topup_amount || 50);
    }
  }, [entitlements]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setLanguage(profile.language || 'en');
      setAiTone(profile.ai_tone || 'professional');
    }
    if (organization) {
      setCompanyName(organization.name || '');
      setVatNumber(organization.vat_number || '');
      setBillingStreet(organization.billing_street || '');
      setBillingCity(organization.billing_city || '');
      setBillingPostal(organization.billing_postal || '');
      setBillingCountry(organization.billing_country || 'IT');
    }
  }, [profile, organization]);

  const handleSaveIdentity = async () => {
    if (!profile) return;
    setSaving(true);
    setSaveMessage('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          language,
          ai_tone: aiTone,
        })
        .eq('id', profile.id);

      if (error) throw error;
      setSaveMessage('Saved successfully!');
      await refreshProfile();
    } catch (e) {
      console.error('Save error:', e);
      setSaveMessage('Failed to save');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleSaveOrganization = async () => {
    if (!organization) return;
    setSaving(true);
    setSaveMessage('');

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: companyName,
          vat_number: vatNumber,
          billing_street: billingStreet,
          billing_city: billingCity,
          billing_postal: billingPostal,
          billing_country: billingCountry,
        })
        .eq('id', organization.id);

      if (error) throw error;
      setSaveMessage('Organization updated!');
      await refreshProfile();
    } catch (e) {
      console.error('Save error:', e);
      setSaveMessage('Failed to save');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const tabs = [
    { id: 'IDENTITY' as const, label: 'Identity', icon: <User size={16} /> },
    { id: 'ORGANIZATION' as const, label: 'Organization', icon: <Building2 size={16} /> },
    { id: 'SYSTEM_ACTIVATION' as const, label: 'System Activation', icon: <Zap size={16} /> },
    { id: 'SUBSCRIPTION' as const, label: 'Subscription', icon: <CreditCard size={16} /> },
  ];

  return (
    <AppPage
      title="Settings"
      subtitle="Manage your profile, organization, and system configuration."
      loading={loading}
      error={error}
      onRetry={retry}
    >
      <div className="flex flex-col lg:flex-row gap-8">
        {/* SIDEBAR TABS - Light Theme */}
        <div className="w-full lg:w-64 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all
                ${activeTab === tab.id
                  ? 'bg-stone-900 text-white shadow-premium'
                  : 'bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-900 border border-stone-200'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT AREA - Light Theme */}
        <div className="flex-1">
          <AppCard variant="light" className="p-8">
            {/* IDENTITY TAB */}
            {activeTab === 'IDENTITY' && (
              <AppSection title="Personal Identity" subtitle="Your profile information">
                <div className="space-y-6 mt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      label="Full Name"
                      name="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      icon={User}
                    />
                    <FormField
                      label="Email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={() => { }}
                      placeholder="admin@company.com"
                      icon={Mail}
                      disabled
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      label="Phone"
                      name="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      icon={Phone}
                    />
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                        Language
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-4 py-3 bg-stone-100 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 ring-stone-300"
                      >
                        <option value="en">English</option>
                        <option value="it">Italiano</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="pt">Português</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                      AI Tone
                    </label>
                    <div className="flex gap-2">
                      {['professional', 'friendly', 'formal', 'casual'].map((tone) => (
                        <button
                          key={tone}
                          onClick={() => setAiTone(tone)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${aiTone === tone
                            ? 'bg-stone-900 text-white'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-stone-200'
                            }`}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-stone-200">
                    <AppButton
                      variant="primary"
                      icon={<Check size={16} />}
                      onClick={handleSaveIdentity}
                      loading={saving}
                    >
                      Save Changes
                    </AppButton>
                    {saveMessage && (
                      <span
                        className={`text-sm font-medium ${saveMessage.includes('success') ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {saveMessage}
                      </span>
                    )}
                  </div>
                </div>
              </AppSection>
            )}

            {/* ORGANIZATION TAB */}
            {activeTab === 'ORGANIZATION' && (
              <AppSection title="Organization" subtitle="Manage your company and billing settings">
                <div className="space-y-6 mt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      label="Company Legal Name"
                      name="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Acme Corporation S.r.l."
                      icon={Building2}
                    />
                    <FormField
                      label="VAT / Tax ID"
                      name="vatNumber"
                      value={vatNumber}
                      onChange={(e) => setVatNumber(e.target.value)}
                      placeholder="IT12345678901"
                    />
                  </div>

                  <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
                    <h4 className="text-xs font-bold text-stone-600 uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={14} /> Billing Address
                    </h4>
                    <FormField
                      label="Street"
                      name="billingStreet"
                      value={billingStreet}
                      onChange={(e) => setBillingStreet(e.target.value)}
                      placeholder="Via Roma, 123"
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        label="City"
                        name="billingCity"
                        value={billingCity}
                        onChange={(e) => setBillingCity(e.target.value)}
                        placeholder="Milan"
                      />
                      <FormField
                        label="Postal Code"
                        name="billingPostal"
                        value={billingPostal}
                        onChange={(e) => setBillingPostal(e.target.value)}
                        placeholder="20121"
                      />
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                          Country
                        </label>
                        <select
                          value={billingCountry}
                          onChange={(e) => setBillingCountry(e.target.value)}
                          className="w-full px-4 py-3 bg-stone-100 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 ring-stone-300"
                        >
                          <option value="IT">Italy</option>
                          <option value="US">United States</option>
                          <option value="GB">United Kingdom</option>
                          <option value="DE">Germany</option>
                          <option value="FR">France</option>
                          <option value="ES">Spain</option>
                          <option value="PT">Portugal</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200">
                    <h4 className="text-xs font-bold text-stone-600 uppercase tracking-widest flex items-center gap-2 mb-4">
                      <Users size={14} /> Team Members
                    </h4>
                    <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 text-center">
                      <p className="text-sm text-amber-400">
                        Team invitation feature coming soon. You will be able to invite
                        collaborators with Manager or Viewer roles.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-stone-200">
                    <AppButton
                      variant="primary"
                      icon={<Check size={16} />}
                      onClick={handleSaveOrganization}
                      loading={saving}
                    >
                      Save Organization
                    </AppButton>
                    {saveMessage && (
                      <span
                        className={`text-sm font-medium ${saveMessage.includes('success') || saveMessage.includes('updated') ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {saveMessage}
                      </span>
                    )}
                  </div>
                </div>
              </AppSection>
            )}

            {/* SYSTEM ACTIVATION TAB */}
            {activeTab === 'SYSTEM_ACTIVATION' && (
              <AppSection
                title="System Activation"
                subtitle="Connect your systems and upload documents"
              >
                <div className="space-y-6 mt-8">
                  {/* WhatsApp Connection */}
                  <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                          <Phone size={24} className="text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-stone-900">WhatsApp Business API</h3>
                          <p className="text-sm text-stone-600">
                            Connect your WhatsApp Business Account for guest messaging
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <AppBadge variant="neutral">Not Connected</AppBadge>
                        <AppButton
                          variant="primary"
                          size="sm"
                          onClick={() => setWhatsAppModalOpen(true)}
                        >
                          Configure
                        </AppButton>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-white rounded-xl">
                      <p className="text-xs text-stone-500 mb-2 font-bold uppercase tracking-widest">
                        Required for activation:
                      </p>
                      <ul className="text-sm text-stone-600 space-y-1">
                        <li>• WhatsApp Business Account ID (WABA ID)</li>
                        <li>• Phone Number ID</li>
                        <li>• Permanent Access Token</li>
                        <li>• Webhook Verify Token</li>
                      </ul>
                    </div>
                  </div>

                  {/* PMS Connection */}
                  <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                          <Building2 size={24} className="text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-stone-900">PMS Integration</h3>
                          <p className="text-sm text-stone-600">
                            Connect your Property Management System
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <AppBadge variant="neutral">Not Connected</AppBadge>
                        <AppButton
                          variant="primary"
                          size="sm"
                          onClick={() => setPmsModalOpen(true)}
                        >
                          Connect
                        </AppButton>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-white rounded-xl">
                      <p className="text-xs text-stone-500 mb-2 font-bold uppercase tracking-widest">
                        Supported PMS:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {['Cloudbeds', 'Mews', 'Opera', 'Protel', 'Apaleo', 'Other'].map((pms) => (
                          <span
                            key={pms}
                            className="px-3 py-1 bg-stone-100 rounded-lg text-xs text-stone-600"
                          >
                            {pms}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Knowledge Base */}
                  <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                          <FileText size={24} className="text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-stone-900">Knowledge Base</h3>
                          <p className="text-sm text-stone-600">Upload documents for AI training</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <AppBadge variant="neutral">0 Documents</AppBadge>
                        <AppButton
                          variant="primary"
                          size="sm"
                          icon={<Upload size={14} />}
                          onClick={() => setKnowledgeModalOpen(true)}
                        >
                          Upload
                        </AppButton>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-white rounded-xl">
                      <p className="text-xs text-stone-500 mb-2 font-bold uppercase tracking-widest">
                        Accepted formats:
                      </p>
                      <p className="text-sm text-stone-600">
                        PDF, DOCX, TXT, MD • Max 10MB per file
                      </p>
                    </div>
                  </div>
                </div>
              </AppSection>
            )}

            {/* SUBSCRIPTION TAB */}
            {activeTab === 'SUBSCRIPTION' && (
              <AppSection title="Subscription" subtitle="Your current plan and institutional credits">
                <div className="space-y-8 mt-8">
                  {/* Current Plan */}
                  <div className="p-8 bg-stone-900 text-white rounded-[2.5rem] shadow-premium relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 gold-gradient opacity-10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    <div className="flex items-center gap-4 mb-6 relative z-10">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-white/20 shadow-gold-glow">
                        <Crown size={32} className="text-gold-start" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">
                          {entitlements?.plan_tier?.toUpperCase() || 'VIP'} Plan
                        </h3>
                        <p className="text-stone-400">Institutional Subscription</p>
                      </div>
                      <div className="ml-auto">
                        <AppBadge variant="success">Active</AppBadge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                          Billing Period
                        </p>
                        <p className="text-lg font-bold text-white">
                          Monthly
                        </p>
                        <p className="text-[10px] text-stone-400">Next renewal: {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString()}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
                        <p className="text-[10px] font-bold text-gold-start uppercase tracking-wider mb-1">
                          ArmoCredits™ Available
                        </p>
                        <p className="text-3xl font-black text-white">
                          {entitlements?.credits_balance?.toLocaleString() || '25,000'}
                        </p>
                        <button className="text-[10px] text-gold-start hover:underline mt-1 font-bold">
                          View Usage History
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Buy Credits & Auto Top-up */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200">
                      <h4 className="text-xs font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <CreditCard size={14} className="text-stone-400" /> Managed Purchase
                      </h4>
                      <p className="text-sm text-stone-600 mb-6 font-medium">
                        Add one-time credits to your institutional balance. Credits never expire.
                      </p>
                      <div className="space-y-4">
                        <AppButton variant="primary" className="w-full" icon={<Zap size={16} />}>
                          Add Credits Now
                        </AppButton>
                        <p className="text-center text-[10px] text-stone-400">
                          Secure checkout via Stripe Financial Services
                        </p>
                      </div>
                    </div>

                    <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2">
                          <Crown size={14} className="text-stone-400" /> Auto Top-up
                        </h4>
                        <button
                          onClick={() => setAutoTopupEnabled(!autoTopupEnabled)}
                          className={`w-10 h-5 rounded-full transition-all relative ${autoTopupEnabled ? 'bg-gold-start' : 'bg-stone-300'}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoTopupEnabled ? 'left-6' : 'left-1'}`} />
                        </button>
                      </div>
                      <p className="text-sm text-stone-600 mb-6 font-medium leading-relaxed">
                        {autoTopupEnabled
                          ? `Automatically add ${autoTopupAmount} credits when balance falls below ${autoTopupThreshold}.`
                          : "Credit balance is currently managed manually. System will pause at zero."}
                      </p>
                      <AppButton variant="outline" size="sm" className="w-full">
                        Manage Auto Top-up
                      </AppButton>
                    </div>
                  </div>

                  {/* Plan Upgrade */}
                  <div className="p-8 border-2 border-dashed border-stone-200 rounded-[2rem] flex flex-col items-center text-center">
                    <h3 className="text-lg font-bold text-stone-900 mb-2">Need more institutional power?</h3>
                    <p className="text-sm text-stone-500 mb-6 max-w-sm">
                      Upgrade to a higher tier for increased capacity, priority execution, and advanced cognitive depth.
                    </p>
                    <AppButton variant="secondary" icon={<Crown size={18} className="text-gold-start" />}>
                      Explore Plans & Tiers
                    </AppButton>
                  </div>
                </div>
              </AppSection>
            )}
          </AppCard>
        </div>
      </div>

      {/* Modals */}
      <ConfigureWhatsAppModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
      />
      <ConfigurePMSModal isOpen={pmsModalOpen} onClose={() => setPmsModalOpen(false)} />
      <UploadKnowledgeModal
        isOpen={knowledgeModalOpen}
        onClose={() => setKnowledgeModalOpen(false)}
      />
    </AppPage>
  );
};

export default Settings;
