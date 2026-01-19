import React from 'react';
import { useAuth } from '@/frontend/contexts/AuthContext';
import { supabase } from '@/database/supabase';
import { ShieldAlert, CreditCard, Mail, LogOut, Zap, Calendar, RefreshCw } from 'lucide-react';

// Expose supabase to window for emergency logout
if (typeof window !== 'undefined') {
  (window as unknown as { supabase: typeof supabase }).supabase = supabase;
}

interface SubscriptionGateProps {
  children: React.ReactNode;
  onOpenPlans?: () => void;
  onOpenContact?: () => void;
}

interface CreditsGateProps {
  children: React.ReactNode;
  onBuyCredits?: () => void;
  onEnableAutoTopup?: () => void;
}

/**
 * SubscriptionGate - Modal overlay that blurs the app when subscription is not active
 * The app content renders behind the blurred backdrop
 */
export const SubscriptionGate: React.FC<SubscriptionGateProps> = ({
  children,
  onOpenPlans,
  onOpenContact,
}) => {
  const { user, isAppBlocked, entitlements, loading } = useAuth();

  // Don't block while loading
  if (loading) {
    return <>{children}</>;
  }

  // If no user logged in, don't show paywall (let landing page show)
  if (!user) {
    return <>{children}</>;
  }

  // Allow access if subscription is active
  // Critical: Only block if we HAVE entitlements and they say inactive
  if (!isAppBlocked || !user) {
    return <>{children}</>;
  }

  const handleSubscribe = () => {
    if (onOpenPlans) {
      onOpenPlans();
    }
  };

  const handleContact = () => {
    if (onOpenContact) {
      onOpenContact();
    }
  };

  const handleLogout = async () => {
    // Clear all storage
    window.localStorage.clear();
    window.sessionStorage.clear();
    // Sign out from Supabase directly (bypass context)
    await supabase.auth.signOut();
    // Force hard reload to landing
    window.location.href = '/';
  };

  // Render children with blurred modal overlay
  return (
    <>
      {/* App content behind (blurred) */}
      <div className="pointer-events-none select-none">{children}</div>

      {/* Modal overlay with backdrop blur */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-md">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-2xl border border-stone-100 text-center animate-in zoom-in-95 fade-in duration-300">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8 text-amber-500" />
          </div>

          <h1 className="text-2xl font-serif text-stone-900 mb-3">Subscription Required</h1>

          <p className="text-stone-500 text-sm leading-relaxed mb-8">
            Your subscription is not active. Please subscribe to access the Armonyco platform and
            unlock all governance features.
          </p>

          <div className="bg-stone-50 rounded-2xl p-4 mb-8 border border-stone-100">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-stone-400 uppercase font-bold tracking-widest">Status</span>
              <span className="text-amber-600 font-bold">
                {entitlements?.subscription_status?.toUpperCase() || 'INACTIVE'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-stone-400 uppercase font-bold tracking-widest">Credits</span>
              <span className="text-stone-600 font-mono">
                {entitlements?.credits_balance?.toLocaleString() || '0'}
              </span>
            </div>
          </div>

          {/* Primary CTA: Subscribe */}
          <button
            onClick={handleSubscribe}
            className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-stone-900 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-all mb-4"
          >
            <CreditCard className="w-4 h-4" />
            View Plans & Subscribe
          </button>

          {/* Secondary actions */}
          <div className="flex gap-3">
            <button
              onClick={handleContact}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-stone-100 text-stone-600 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-stone-200 transition-all"
            >
              <Mail className="w-3 h-3" />
              Contact Support
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-stone-100 text-stone-600 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-stone-200 transition-all"
            >
              <LogOut className="w-3 h-3" />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * CreditsGate - Modal overlay when credits are depleted
 * Shows pause message with reset date and buy more/auto top-up options
 */
export const CreditsGate: React.FC<CreditsGateProps> = ({
  children,
  onBuyCredits,
  onEnableAutoTopup,
}) => {
  const { isCreditsBlocked, entitlements, isAppBlocked } = useAuth();

  // Don't show if subscription is blocked (SubscriptionGate handles that)
  // Only show if subscription is active but credits are depleted
  if (isAppBlocked || !isCreditsBlocked) {
    return <>{children}</>;
  }

  // Calculate next reset date (1st of next month)
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysUntilReset = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <>
      {/* App content behind (blurred) */}
      <div className="pointer-events-none select-none">{children}</div>

      {/* Credits depleted modal overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-amber-900/30 backdrop-blur-md">
        <div className="max-w-lg w-full bg-white rounded-3xl p-10 shadow-2xl border border-amber-100 text-center animate-in zoom-in-95 fade-in duration-300">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap className="w-8 h-8 text-amber-600" />
          </div>

          <h1 className="text-2xl font-serif text-stone-900 mb-3">Armo Credits™ Depleted</h1>

          <p className="text-stone-500 text-sm leading-relaxed mb-6">
            Your monthly Armo Credits™ have been exhausted. All automation operations are{' '}
            <strong>paused</strong> until credits are replenished.
          </p>

          {/* Status card */}
          <div className="bg-amber-50 rounded-2xl p-5 mb-6 border border-amber-100 text-left">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-xs font-bold text-stone-900">Monthly Reset</p>
                <p className="text-xs text-stone-500">
                  Credits refresh in{' '}
                  <strong className="text-amber-700">{daysUntilReset} days</strong>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-amber-600" />
              <div>
                <p className="text-xs font-bold text-stone-900">Current Balance</p>
                <p className="text-xs text-stone-500">
                  <span className="font-mono text-red-600">
                    {entitlements?.credits_balance?.toLocaleString() || '0'}
                  </span>{' '}
                  Armo Credits™ remaining
                </p>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            <button
              onClick={onBuyCredits}
              className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-amber-600 transition-all"
            >
              <CreditCard className="w-4 h-4" />
              Buy More Credits
            </button>

            <button
              onClick={onEnableAutoTopup}
              className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-stone-900 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-all"
            >
              <Zap className="w-4 h-4" />
              Enable Auto Top-Up
            </button>
          </div>

          <p className="text-[10px] text-stone-400 uppercase tracking-widest">
            Auto top-up automatically adds credits when balance is low
          </p>
        </div>
      </div>
    </>
  );
};

/**
 * CreditsDepletedBanner - Shows warning banner when credits are low (for non-blocking display)
 */
export const CreditsDepletedBanner: React.FC = () => {
  const { isCreditsBlocked, isAppBlocked } = useAuth();

  // Don't show if subscription gate is already blocking
  if (isAppBlocked || !isCreditsBlocked) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Zap className="w-5 h-5 text-amber-600" />
        <span className="text-sm text-amber-800">
          <strong>Credits depleted.</strong> Automations are paused until you add more credits.
        </span>
      </div>
      <a
        href="#add-credits"
        className="text-xs font-bold uppercase tracking-widest text-amber-700 hover:text-amber-900 transition-colors"
      >
        Add Credits →
      </a>
    </div>
  );
};
