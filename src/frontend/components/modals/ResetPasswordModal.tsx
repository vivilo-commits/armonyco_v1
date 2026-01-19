import React, { useState } from 'react';
import { Mail, ArrowRight, Check } from 'lucide-react';
import { BaseModal } from '../design-system/BaseModal';
import { FormField } from '../design-system/FormField';
import { AppButton } from '../design-system';
import { supabase } from '@/database/supabase';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successSent, setSuccessSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      setSuccessSent(true);
      setTimeout(() => {
        onClose();
        setSuccessSent(false);
        setEmail('');
      }, 3000);
    } catch (err: unknown) {
      const authError = err as { message: string };
      setError(authError.message || 'Failed to send reset email. Please try again.');
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Reset Password"
      subtitle="Enter your email to receive a password reset link"
    >
      <div className="space-y-6 py-4">
        {successSent ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-2">Email Sent!</h3>
            <p className="text-sm text-stone-600">Check your inbox for the password reset link.</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-6">
              <FormField
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                icon={Mail}
                required
              />

              <AppButton
                type="submit"
                loading={loading}
                variant="primary"
                className="w-full py-4"
                icon={<ArrowRight size={16} />}
              >
                Send Reset Link
              </AppButton>

              <div className="text-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-stone-500 hover:text-stone-900 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </BaseModal>
  );
};
