import React from 'react';
import { BaseModal } from '../design-system/BaseModal';
import { AppButton } from '../design-system';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Sign Out"
      subtitle="Are you sure you want to leave?"
    >
      <div className="space-y-6 py-4">
        <p className="text-stone-600 text-center">
          You will need to log in again to access your dashboard.
        </p>

        <div className="flex gap-3 pt-4">
          <AppButton onClick={onClose} variant="secondary" className="flex-1">
            Cancel
          </AppButton>
          <AppButton onClick={onConfirm} variant="primary" loading={loading} className="flex-1">
            Sign Out
          </AppButton>
        </div>
      </div>
    </BaseModal>
  );
};
