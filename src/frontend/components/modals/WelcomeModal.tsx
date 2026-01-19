import React, { useState } from 'react';
import { BaseModal } from '../design-system/BaseModal';
import { AppButton } from '../design-system';
import { ASSETS } from '@/frontend/assets';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      window.localStorage.setItem('hideWelcomeModal', 'true');
    }
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Session Active"
      subtitle="System ready for operations"
    >
      <div className="space-y-6 py-4">
        <div className="flex flex-col items-center gap-4">
          <img src={ASSETS.logos.full} alt="Armonyco" className="h-12 w-auto" />
          <p className="text-stone-600 text-center">
            All systems operational. Your dashboard is ready.
          </p>
        </div>

        <div className="flex items-center justify-between pt-4">
          <label className="flex items-center gap-2 text-sm text-stone-500 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-stone-300"
            />
            Don&apos;t show again
          </label>

          <AppButton onClick={handleClose} variant="primary">
            Continue
          </AppButton>
        </div>
      </div>
    </BaseModal>
  );
};
