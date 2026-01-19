import React, { useState } from 'react';
import { Phone, Check, Key, Hash, Shield } from 'lucide-react';
import { BaseModal } from '../design-system/BaseModal';
import { FormField } from '../design-system/FormField';
import { AppButton } from '../design-system';

interface ConfigureWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfigureWhatsAppModal: React.FC<ConfigureWhatsAppModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [wabaId, setWabaId] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [webhookToken, setWebhookToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleTest = async () => {
    setTestStatus('testing');
    // TODO: Test connection with WhatsApp API
    await new Promise((r) => setTimeout(r, 1500));
    setTestStatus('success');
  };

  const handleSave = async () => {
    setSaving(true);
    // TODO: Save to Supabase
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    onClose();
  };

  const isValid = wabaId && phoneNumberId && accessToken && webhookToken;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="WhatsApp Business API"
      subtitle="Connect your WhatsApp Business Account"
      icon={<Phone size={24} />}
      maxWidth="max-w-lg"
      footer={
        <>
          <AppButton variant="secondary" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton
            variant="outline"
            onClick={handleTest}
            disabled={!isValid || testStatus === 'testing'}
          >
            {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
          </AppButton>
          <AppButton
            variant="primary"
            icon={<Check size={16} />}
            onClick={handleSave}
            loading={saving}
            disabled={!isValid || testStatus !== 'success'}
          >
            Save Configuration
          </AppButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="p-4 bg-green-50 rounded-xl border border-green-100 mb-6">
          <p className="text-xs text-green-800 font-medium">
            Get these credentials from your{' '}
            <a
              href="https://business.facebook.com/settings/whatsapp-business-accounts"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold"
            >
              Meta Business Suite
            </a>
          </p>
        </div>

        <FormField
          label="WhatsApp Business Account ID (WABA ID)"
          name="wabaId"
          value={wabaId}
          onChange={(e) => setWabaId(e.target.value)}
          placeholder="123456789012345"
          icon={Hash}
          required
        />

        <FormField
          label="Phone Number ID"
          name="phoneNumberId"
          value={phoneNumberId}
          onChange={(e) => setPhoneNumberId(e.target.value)}
          placeholder="987654321098765"
          icon={Phone}
          required
        />

        <FormField
          label="Permanent Access Token"
          name="accessToken"
          type="password"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          placeholder="EAAxxxxxxxx..."
          icon={Key}
          required
        />

        <FormField
          label="Webhook Verify Token"
          name="webhookToken"
          value={webhookToken}
          onChange={(e) => setWebhookToken(e.target.value)}
          placeholder="your-custom-verify-token"
          icon={Shield}
          required
        />

        {testStatus === 'success' && (
          <div className="p-4 bg-green-50 rounded-xl border border-green-200 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Check size={16} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-green-800">Connection Successful</p>
              <p className="text-xs text-green-600">Ready to save configuration</p>
            </div>
          </div>
        )}

        {testStatus === 'error' && (
          <div className="p-4 bg-red-50 rounded-xl border border-red-200">
            <p className="text-sm text-red-600">
              Connection failed. Please verify your credentials.
            </p>
          </div>
        )}

        <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 mt-4">
          <p className="text-xs text-stone-600 mb-2 font-bold uppercase tracking-wider">
            Webhook URL (for Meta configuration):
          </p>
          <code className="text-xs bg-stone-200 px-2 py-1 rounded text-stone-800 break-all">
            https://your-n8n-instance.com/webhook/whatsapp
          </code>
        </div>
      </div>
    </BaseModal>
  );
};
