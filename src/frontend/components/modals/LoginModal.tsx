import React, { useState } from 'react';
import { Mail, ArrowRight } from 'lucide-react';
import { BaseModal } from '../design-system/BaseModal';
import { FormField } from '../design-system/FormField';
import { AppButton, TOKENS } from '../design-system';
import { PasswordInput } from '../design-system/PasswordInput';
import { ResetPasswordModal } from './ResetPasswordModal';

import { supabase } from '@/database/supabase';

import { ASSETS } from '@/frontend/assets';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Map Supabase errors to user-friendly messages
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error(
            'Invalid email or password. Please check your credentials and try again.'
          );
        } else if (authError.message.includes('Email not confirmed')) {
          throw new Error('Please confirm your email address before logging in.');
        } else if (authError.message.includes('User not found')) {
          throw new Error('No account found with this email. Please sign up first.');
        } else {
          throw authError;
        }
      }

      onLoginSuccess();
    } catch (err: unknown) {
      const authError = err as { message: string };
      setError(authError.message || 'Authentication failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Authorized Access"
      subtitle="Identification required for matrix entry"
      footer={
        <div className="w-full text-center">
          <p className={TOKENS.typography.sectionHeader}>Protected by Armonyco Security Protocol</p>
        </div>
      }
    >
      <div className="space-y-10 py-4">
        <div className="flex flex-col items-center gap-6 mb-8">
          <img src={ASSETS.logos.full} alt="Armonyco" className="h-16 w-auto object-contain" />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2 animate-in fade-in duration-300">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-8">
          <div className="space-y-6 text-left">
            <FormField
              label="Security Clearance (Email)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@armonyco.ai"
              icon={Mail}
              required
            />

            <PasswordInput
              value={password}
              onChange={setPassword}
              label="Access Cipher (Password)"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="pt-2">
            <AppButton
              type="submit"
              loading={loading}
              variant="primary"
              className="w-full py-4 text-[11px]"
              icon={<ArrowRight size={16} />}
            >
              Establish Secure Connection
            </AppButton>
          </div>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => {
                setShowResetPassword(true);
              }}
              className="text-xs text-stone-500 hover:text-stone-900 transition-colors font-medium"
            >
              Forgot Password?
            </button>
          </div>
        </form>
      </div>

      <ResetPasswordModal isOpen={showResetPassword} onClose={() => setShowResetPassword(false)} />
    </BaseModal>
  );
};
