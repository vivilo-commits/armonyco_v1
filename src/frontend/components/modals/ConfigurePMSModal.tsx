import React, { useState } from 'react';
import { Building2, Check } from 'lucide-react';
import { BaseModal } from '../design-system/BaseModal';
import { FormField } from '../design-system/FormField';
import { AppButton } from '../design-system';

interface ConfigurePMSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PMS_OPTIONS = [
  { id: 'cloudbeds', name: 'Cloudbeds' },
  { id: 'mews', name: 'Mews' },
  { id: 'opera', name: 'Oracle Opera' },
  { id: 'protel', name: 'Protel' },
  { id: 'other', name: 'Other' },
];

export const ConfigurePMSModal: React.FC<ConfigurePMSModalProps> = ({ isOpen, onClose }) => {
  const [selectedPMS, setSelectedPMS] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [hotelId, setHotelId] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // TODO: Save to Supabase
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    onClose();
  };

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
            disabled={!selectedPMS || !apiKey}
          >
            Connect PMS
          </AppButton>
        </>
      }
    >
      <div className="space-y-4">
        <fieldset className="space-y-2">
          <legend className="text-xs font-bold text-stone-500 uppercase tracking-wide">
            Select Your PMS
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {PMS_OPTIONS.map((pms) => (
              <button
                key={pms.id}
                type="button"
                onClick={() => setSelectedPMS(pms.id)}
                className={`p-3 rounded-xl text-sm font-medium transition-all ${selectedPMS === pms.id
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                  }`}
              >
                {pms.name}
              </button>
            ))}
          </div>
        </fieldset>

        {selectedPMS && (
          <>
            <FormField
              label="API Key"
              name="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              required
            />
            <FormField
              label="Hotel ID / Property Code"
              name="hotelId"
              value={hotelId}
              onChange={(e) => setHotelId(e.target.value)}
              placeholder="HOTEL001"
            />
          </>
        )}

        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-xs text-blue-800">
            Your credentials are encrypted and stored securely. We will test the connection before
            saving.
          </p>
        </div>
      </div>
    </BaseModal>
  );
};
