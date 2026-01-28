import React, { useState, useEffect, useCallback } from 'react';
import { PropertiesTable } from './PropertiesTable';


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
  Trash2,
  Plus,
  Eye,
  EyeOff,
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
import { Plans } from '@/frontend/components/modals/PlansModal';
import { RechargeModal } from '@/frontend/components/modals/RechargeModal';
import { EditMemberModal } from '@/frontend/components/modals/EditMemberModal';
import { CreditTransaction } from '@/backend/types';
import { Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';

import { api } from '@/backend/api';
import { usePageData } from '@/frontend/hooks/usePageData';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '@/database/supabase';

type SettingsTab = 'IDENTITY' | 'ORGANIZATION' | 'PROPERTIES' | 'SYSTEM_ACTIVATION' | 'SUBSCRIPTION';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
}

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('IDENTITY');
  const { profile, organization, entitlements, membership, canEdit, canEditSettings, canManageTeam, canEditGeneralSettings, refreshProfile, organizationId } = useAuth();
  const { loading, error, retry } = usePageData(() => api.getSettingsData());

  // Tabs that managers cannot edit
  const readOnlyTabs: SettingsTab[] = canEditSettings ? [] : ['IDENTITY', 'ORGANIZATION', 'PROPERTIES', 'SYSTEM_ACTIVATION', 'SUBSCRIPTION'];

  // Modal states
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [pmsModalOpen, setPmsModalOpen] = useState(false);
  const [knowledgeModalOpen, setKnowledgeModalOpen] = useState(false);
  const [plansModalOpen, setPlansModalOpen] = useState(false);
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);

  // Editable fields - Identity
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('en');
  // Removed AI Tone state

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

  // Team members
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('viewer');
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Edit member state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

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

  const fetchTeamMembers = useCallback(async () => {
    if (!organization?.id) return;
    setLoadingTeam(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('organization_members')
        .select('*, profiles(*)')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setTeamMembers(data || []);
    } catch (e) {
      console.error('Failed to fetch team members:', e);
    } finally {
      setLoadingTeam(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    if (activeTab === 'ORGANIZATION' && organization?.id) {
      fetchTeamMembers();
    }
    if (activeTab === 'SUBSCRIPTION' && organization?.id) {
      fetchTransactions();
    }
  }, [activeTab, organization?.id, fetchTeamMembers]);

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const data = await api.getCreditTransactions();
      setTransactions(data || []);
    } catch (e) {
      console.error('Failed to fetch transactions:', e);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleCreateSubAccount = async () => {
    if (!newEmail || !newPassword || !newFullName) {
      setSaveMessage('Please fill all fields');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    if (newPassword.length < 6) {
      setSaveMessage('Password must be at least 6 characters');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    setCreating(true);
    try {
      await api.createSubAccount(newEmail, newPassword, newFullName, newRole);
      setNewEmail('');
      setNewPassword('');
      setNewFullName('');
      await fetchTeamMembers();
      setSaveMessage('Account created successfully!');
    } catch (e: any) {
      console.error('Create error:', e);
      // Parse specific error types
      const errorMsg = e.message || '';
      if (errorMsg.includes('429') || errorMsg.includes('security purposes')) {
        // Extract wait time if present
        const waitMatch = errorMsg.match(/after (\d+) seconds/);
        const waitTime = waitMatch ? waitMatch[1] : '60';
        setSaveMessage(`Rate limited. Please wait ${waitTime} seconds and try again.`);
      } else if (errorMsg.includes('403') || errorMsg.includes('forbidden')) {
        setSaveMessage('Permission denied. Check Supabase auth settings.');
      } else if (errorMsg.includes('already registered') || errorMsg.includes('already exists')) {
        setSaveMessage('This email is already registered.');
      } else {
        setSaveMessage(errorMsg || 'Failed to create account');
      }
    } finally {
      setCreating(false);
      setTimeout(() => setSaveMessage(''), 5000);
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchTeamMembers();
    } catch (e) {
      console.error('Remove error:', e);
    }
  };

  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const onSaveMember = async (memberId: string, updates: { role?: string; full_name?: string }) => {
    try {
      await api.updateTeamMember(memberId, updates);
      await fetchTeamMembers();
      setSaveMessage('Team member updated successfully');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (e) {
      console.error('Failed to update team member:', e);
      throw e;
    }
  };

  const handleSaveIdentity = async () => {
    if (!profile || !canEditGeneralSettings) return;
    setSaving(true);
    setSaveMessage('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          language,
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
    if (!organization || !canEditGeneralSettings) return;
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

  const handleBuyCredits = () => {
    setRechargeModalOpen(true);
  };

  const handleToggleAutoTopup = async (enabled: boolean) => {
    try {
      await api.updateAutoTopup(enabled, autoTopupThreshold, autoTopupAmount);
      setAutoTopupEnabled(enabled);
      await refreshProfile();
    } catch (e) {
      console.error('Failed to toggle auto top-up:', e);
    }
  };

  const tabs = [
    { id: 'IDENTITY' as const, label: 'Identity', icon: <User size={16} /> },
    { id: 'ORGANIZATION' as const, label: 'Organization', icon: <Building2 size={16} /> },
    { id: 'PROPERTIES' as const, label: 'Properties', icon: <Building2 size={16} /> }, // Using Building2 as temporary icon
    { id: 'SYSTEM_ACTIVATION' as const, label: 'System Activation', icon: <Zap size={16} /> },
    { id: 'SUBSCRIPTION' as const, label: 'Subscription', icon: <CreditCard size={16} /> },
  ];

  return (
    <AppPage
      title="System Identity"
      subtitle="Define your institutional persona and system activation parameters."
      loading={loading}
      error={error}
      onRetry={retry}
    >
      <div className="space-y-8">
        {/* EMBEDDED HORIZONTAL MENU */}
        <div className="flex bg-stone-100/50 p-1.5 rounded-2xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all
                ${activeTab === tab.id
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT AREA - Light Theme */}
        <div className="w-full">
          <AppCard variant="light" className="p-8">
            {/* IDENTITY TAB */}
            {activeTab === 'IDENTITY' && (
              <AppSection title="Identity" subtitle="Your institutional profile information">
                <div className="space-y-6 mt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      label="Full Name"
                      name="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      icon={User}
                      disabled={readOnlyTabs.includes('IDENTITY')}
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
                      disabled={readOnlyTabs.includes('IDENTITY')}
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

                  {/* AI Tone removed */}

                  {!readOnlyTabs.includes('IDENTITY') && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-6 mt-4 border-t border-stone-100">
                      <AppButton
                        variant="primary"
                        icon={<Check size={16} />}
                        onClick={handleSaveIdentity}
                        loading={saving}
                      >
                        Save Personal Changes
                      </AppButton>
                      {saveMessage && (
                        <div
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold animate-in fade-in slide-in-from-left-2 transition-all ${saveMessage.includes('success')
                            ? 'bg-green-50 text-green-600 border border-green-100'
                            : 'bg-red-50 text-red-600 border border-red-100'}`}
                        >
                          {saveMessage.includes('success') ? <Check size={14} /> : null}
                          {saveMessage}
                        </div>
                      )}
                    </div>
                  )}
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
                      disabled={readOnlyTabs.includes('ORGANIZATION')}
                    />
                    <FormField
                      label="VAT / Tax ID"
                      name="vatNumber"
                      value={vatNumber}
                      onChange={(e) => setVatNumber(e.target.value)}
                      placeholder="IT12345678901"
                      disabled={!canEdit}
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
                      disabled={!canEdit}
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        label="City"
                        name="billingCity"
                        value={billingCity}
                        onChange={(e) => setBillingCity(e.target.value)}
                        placeholder="Milan"
                        disabled={!canEdit}
                      />
                      <FormField
                        label="Postal Code"
                        name="billingPostal"
                        value={billingPostal}
                        onChange={(e) => setBillingPostal(e.target.value)}
                        placeholder="20121"
                        disabled={!canEdit}
                      />
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                          Country
                        </label>
                        <select
                          value={billingCountry}
                          onChange={(e) => setBillingCountry(e.target.value)}
                          disabled={!canEdit}
                          className="w-full px-4 py-3 bg-stone-100 border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 ring-stone-300 disabled:opacity-50"
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
                    <div className="mb-6">
                      <h4 className="text-xs font-bold text-stone-600 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Users size={14} /> Team Members
                      </h4>
                      {canManageTeam && (
                        <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-4 mb-6">
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Create New Member</p>
                          <div className="flex flex-col lg:flex-row gap-3 items-stretch">
                            <input
                              type="text"
                              placeholder="Full Name"
                              value={newFullName}
                              onChange={(e) => setNewFullName(e.target.value)}
                              className="flex-1 min-w-0 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none ring-stone-900 focus:ring-1"
                            />
                            <input
                              type="email"
                              placeholder="Email Address"
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              className="flex-1 min-w-0 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none ring-stone-900 focus:ring-1"
                            />
                            <div className="relative flex-1 min-w-0">
                              <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2.5 pr-10 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none ring-stone-900 focus:ring-1"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                              >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                            <select
                              value={newRole}
                              onChange={(e) => setNewRole(e.target.value)}
                              className="lg:w-40 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none ring-stone-900 focus:ring-1"
                            >
                              <option value="viewer">Viewer</option>
                              <option value="manager">Manager</option>
                            </select>
                            <AppButton
                              size="sm"
                              icon={<Plus size={14} />}
                              onClick={handleCreateSubAccount}
                              loading={creating}
                              className="lg:w-auto whitespace-nowrap"
                            >
                              Create +
                            </AppButton>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {loadingTeam ? (
                        <div className="text-center py-4 text-stone-400 animate-pulse">Loading team...</div>
                      ) : teamMembers.length === 0 ? (
                        <div className="bg-white p-6 rounded-xl border border-stone-100 text-center">
                          <p className="text-sm text-stone-500 italic">No other members yet</p>
                        </div>
                      ) : (
                        teamMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-4 bg-white rounded-xl border border-stone-100 hover:border-stone-200 transition-all group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-600">
                                {member.profiles?.full_name?.[0] || member.profiles?.email?.[0]?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-stone-900">
                                  {member.profiles?.full_name || member.profiles?.email || 'New Member'}
                                </p>
                                <p className="text-xs text-stone-500">{member.profiles?.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {membership?.role?.toLowerCase() === 'owner' && (
                                <button
                                  onClick={() => handleEditMember(member)}
                                  className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-all"
                                  title="Edit Member"
                                >
                                  <FileText size={16} />
                                </button>
                              )}
                              <AppBadge variant={
                                member.role === 'owner' ? 'success' :
                                  member.role === 'admin' ? 'warning' :
                                    member.role === 'manager' ? 'info' : 'neutral'
                              }>
                                {member.role.toUpperCase()}
                              </AppBadge>
                              {canEdit && member.role !== 'owner' && (
                                <button
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="p-2 text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-6 border-t border-stone-100">
                    <AppButton
                      variant="primary"
                      icon={<Check size={16} />}
                      onClick={handleSaveOrganization}
                      loading={saving}
                    >
                      Save Organization
                    </AppButton>
                    {saveMessage && (
                      <div
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold animate-in fade-in slide-in-from-left-2 transition-all ${saveMessage.includes('success') || saveMessage.includes('updated')
                          ? 'bg-green-50 text-green-600 border border-green-100'
                          : 'bg-red-50 text-red-600 border border-red-100'}`}
                      >
                        {saveMessage.includes('success') || saveMessage.includes('updated') ? <Check size={14} /> : null}
                        {saveMessage}
                      </div>
                    )}
                  </div>
                </div>
              </AppSection>
            )}

            {/* PROPERTIES TAB */}
            {activeTab === 'PROPERTIES' && (
              <AppSection title="Properties Management" subtitle="Manage your portfolio of hotels and units">
                <PropertiesTable />
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
                  <div className="p-6 bg-white rounded-2xl border border-stone-200 hover:border-gold-start/30 transition-all shadow-sm hover:shadow-gold-glow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gold-start/10 rounded-xl flex items-center justify-center">
                          <Phone size={24} className="text-gold-start" />
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
                    <div className="mt-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <p className="text-xs text-stone-500 mb-2 font-bold uppercase tracking-widest">
                        Required for activation:
                      </p>
                      <ul className="text-xs font-medium text-stone-500 space-y-1">
                        <li>• WhatsApp Business Account ID (WABA ID)</li>
                        <li>• Phone Number ID</li>
                        <li>• Permanent Access Token</li>
                        <li>• Webhook Verify Token</li>
                      </ul>
                    </div>
                  </div>

                  {/* PMS Connection */}
                  <div className="p-6 bg-white rounded-2xl border border-stone-200 hover:border-gold-start/30 transition-all shadow-sm hover:shadow-gold-glow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gold-start/10 rounded-xl flex items-center justify-center">
                          <Building2 size={24} className="text-gold-start" />
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
                    <div className="mt-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <p className="text-xs text-stone-500 mb-2 font-bold uppercase tracking-widest">
                        Supported PMS:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {['Krossbooking', 'Guesty', 'Octored'].map((pms) => (
                          <span
                            key={pms}
                            className="px-3 py-1 bg-white border border-stone-200 rounded-lg text-xs text-stone-500 font-bold"
                          >
                            {pms}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Knowledge Base */}
                  <div className="p-6 bg-white rounded-2xl border border-stone-200 hover:border-gold-start/30 transition-all shadow-sm hover:shadow-gold-glow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gold-start/10 rounded-xl flex items-center justify-center">
                          <FileText size={24} className="text-gold-start" />
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
                    <div className="mt-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                      <p className="text-xs text-stone-500 mb-2 font-bold uppercase tracking-widest">
                        Accepted formats:
                      </p>
                      <p className="text-xs font-medium text-stone-500">
                        PDF, Text, URL, Database • Max 10MB per file
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
                        <AppButton
                          variant="primary"
                          className="w-full"
                          icon={<Zap size={16} />}
                          onClick={handleBuyCredits}
                        >
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
                          disabled={!canEdit}
                          onClick={() => handleToggleAutoTopup(!autoTopupEnabled)}
                          className={`w-10 h-5 rounded-full transition-all relative ${autoTopupEnabled ? 'bg-stone-900' : 'bg-stone-300'} ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoTopupEnabled ? 'left-6' : 'left-1'}`} />
                        </button>
                      </div>
                      <p className="text-sm text-stone-600 mb-6 font-medium leading-relaxed">
                        {autoTopupEnabled
                          ? `Automatically add ${autoTopupAmount.toLocaleString()} credits when balance falls below ${autoTopupThreshold.toLocaleString()}.`
                          : "Credit balance is currently managed manually. System will pause at zero."}
                      </p>
                      {canEdit && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Threshold</label>
                              <select
                                value={autoTopupThreshold}
                                onChange={(e) => setAutoTopupThreshold(parseInt(e.target.value))}
                                className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                              >
                                <option value={5000}>5,000</option>
                                <option value={10000}>10,000</option>
                                <option value={25000}>25,000</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Amount</label>
                              <select
                                value={autoTopupAmount}
                                onChange={(e) => setAutoTopupAmount(parseInt(e.target.value))}
                                className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                              >
                                <option value={50000}>50,000</option>
                                <option value={100000}>100,000</option>
                                <option value={200000}>200,000</option>
                              </select>
                            </div>
                          </div>
                          <AppButton
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => api.updateAutoTopup(autoTopupEnabled, autoTopupThreshold, autoTopupAmount).then(() => setSaveMessage('Auto top-up settings updated!'))}
                          >
                            Update Configuration
                          </AppButton>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transaction History */}
                  <div className="mt-12">
                    <h3 className="text-lg font-bold text-stone-900 mb-6 flex items-center gap-2">
                      <Clock size={20} className="text-stone-400" /> Credit History
                    </h3>
                    <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-stone-50 border-b border-stone-200">
                            <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Date</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Type</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Credits</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {loadingTransactions ? (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-stone-400 animate-pulse">Loading history...</td></tr>
                          ) : transactions.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-12 text-center text-stone-400 italic">No transactions found</td></tr>
                          ) : (
                            transactions.map((tx) => (
                              <tr key={tx.id} className="hover:bg-stone-50/50 transition-colors">
                                <td className="px-6 py-4 text-xs text-stone-500 whitespace-nowrap">
                                  {new Date(tx.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    {tx.transaction_type === 'purchase' || tx.transaction_type === 'bonus' ? (
                                      <div className="p-1 bg-green-50 text-green-600 rounded-md"><ArrowUpRight size={14} /></div>
                                    ) : (
                                      <div className="p-1 bg-amber-50 text-amber-600 rounded-md"><ArrowDownRight size={14} /></div>
                                    )}
                                    <span className="text-xs font-bold text-stone-900 capitalize">{tx.transaction_type}</span>
                                  </div>
                                </td>
                                <td className={`px-6 py-4 text-xs font-bold text-right ${tx.transaction_type === 'purchase' || tx.transaction_type === 'bonus' ? 'text-green-600' : 'text-stone-900'
                                  }`}>
                                  {tx.credits_used.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-xs font-mono text-stone-500 text-right">
                                  {tx.credits_after.toLocaleString()}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Plan Upgrade */}
                  <div className="p-8 border-2 border-dashed border-stone-200 rounded-[2rem] flex flex-col items-center text-center">
                    <h3 className="text-lg font-bold text-stone-900 mb-2">Need more institutional power?</h3>
                    <p className="text-sm text-stone-500 mb-6 max-w-sm">
                      Upgrade to a higher tier for increased capacity, priority execution, and advanced cognitive depth.
                    </p>
                    {canEdit && (
                      <AppButton
                        variant="secondary"
                        icon={<Crown size={18} className="text-gold-start" />}
                        onClick={() => setPlansModalOpen(true)}
                      >
                        Explore Plans & Tiers
                      </AppButton>
                    )}
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
      <Plans isOpen={plansModalOpen} onClose={() => setPlansModalOpen(false)} />
      <RechargeModal
        isOpen={rechargeModalOpen}
        onClose={() => setRechargeModalOpen(false)}
        currentBalance={entitlements?.credits_balance || 0}
        autoTopupEnabled={entitlements?.auto_topup_enabled}
        onSuccess={refreshProfile}
      />

      <EditMemberModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        member={selectedMember}
        onSave={onSaveMember}
      />
    </AppPage>
  );
};

export default Settings;
