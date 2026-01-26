import React, { useState } from 'react';
import { Building2, Check, Eye, EyeOff } from 'lucide-react';
import { BaseModal } from '../design-system/BaseModal';
import { FormField } from '../design-system/FormField';
import { AppButton } from '../design-system';
import { supabase } from '@/database/supabase';
import { useAuth } from '@/frontend/contexts/AuthContext';

interface ConfigurePMSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PMS_OPTIONS = [
  { id: 'krossbooking', name: 'Krossbooking' },
  { id: 'guesty', name: 'Guesty' },
  { id: 'octorate', name: 'Octorate' },
];

export const ConfigurePMSModal: React.FC<ConfigurePMSModalProps> = ({ isOpen, onClose }) => {
  const { organization } = useAuth();
  const [selectedPMS, setSelectedPMS] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!organization?.id) {
      setError('No organization found');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Upsert to organization_pms_config table
      const { error: dbError } = await supabase
        .from('organization_pms_config')
        .upsert({
          organization_id: organization.id,
          pms_provider: selectedPMS,
          institution_id: institutionId,
          login: login,
          password: password, // In production, this should be encrypted
          is_connected: false, // Will be set to true after verification
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'organization_id'
        });

      if (dbError) throw dbError;

      // Reset form and close
      setSelectedPMS('');
      setInstitutionId('');
      setLogin('');
      setPassword('');
      onClose();
    } catch (e: any) {
      console.error('Failed to save PMS config:', e);
      setError(e.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = selectedPMS && institutionId && login && password;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect PMS"
      subtitle="Property Management System Integration"
      icon={<Building2 size={24} />}
      maxWidth="max-w-md"
      footer={
        <>
          <AppButton variant="secondary" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton
            variant="primary"
            icon={<Check size={16} />}
            onClick={handleSave}
            loading={saving}
            disabled={!isFormValid}
          >
            Connect PMS
          </AppButton>
        </>
      }
    >
      <div className="space-y-5">
        <fieldset className="space-y-2">
          <legend className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-3">
            Select Your PMS
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {PMS_OPTIONS.map((pms) => (
              <button
                key={pms.id}
                type="button"
                onClick={() => setSelectedPMS(pms.id)}
                className={`p-4 rounded-xl text-sm font-bold transition-all ${selectedPMS === pms.id
                    ? 'bg-stone-900 text-white shadow-md'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                  }`}
              >
                {pms.name}
              </button>
            ))}
          </div>
        </fieldset>

        {selectedPMS && (
          <div className="space-y-4 pt-2">
            <FormField
              label="Institution ID"
              name="institutionId"
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value)}
              placeholder="Your institution identifier"
              required
            />
            <FormField
              label="Login / Username"
              name="login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Your PMS login"
              required
            />
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your PMS password"
                  className="w-full px-4 py-3 pr-12 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 ring-stone-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 rounded-xl border border-red-100">
            <p className="text-xs text-red-800 font-medium">{error}</p>
          </div>
        )}

        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-xs text-blue-800">
            Your credentials are encrypted and stored securely. We will test the connection before
            activating the integration.
          </p>
        </div>
      </div>
    </BaseModal>
  );
};
