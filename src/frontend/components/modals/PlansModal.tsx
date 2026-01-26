import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { PLANS_DATA } from '@/frontend/constants';
import { BaseModal } from '../design-system/BaseModal';
import { stripeApi } from '@/backend/stripe-api';
import { useAuth } from '@/frontend/contexts/AuthContext';

interface PlansProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Plans: React.FC<PlansProps> = ({ isOpen, onClose }) => {
  const [buying, setBuying] = useState(false);
  const { organizationId, user, entitlements } = useAuth();
  const currentPlanId = entitlements?.plan_tier?.toLowerCase() || 'starter';

  const PLAN_RANKS: Record<string, number> = {
    'starter': 0,
    'pro': 1,
    'elite': 2,
    'vip': 3
  };

  const currentPlanRank = PLAN_RANKS[currentPlanId] || 0;


  const handleSelectPlan = async (priceId?: string, planData?: typeof PLANS_DATA[0]) => {
    if (!priceId || !organizationId || !user?.email) return;
    setBuying(true);
    try {
      const { url } = await stripeApi.createCheckoutSession({
        priceId,
        organizationId,
        email: user.email,
        planId: planData?.id,
        planName: planData?.name,
        credits: planData?.includedCredits,
        mode: 'subscription'
      });
      window.location.href = url;
    } catch (error) {
      console.error('[PlansModal] Plan checkout failed:', error);
      alert('Failed to initiate checkout. Please try again.');
    } finally {
      setBuying(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Governance Tiers"
      subtitle="Select the institutional capacity that best fits your volume."
      maxWidth="max-w-6xl"
      footer={
        <div className="w-full flex justify-between items-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
            Governance Level: Enterprise Grade
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors shadow-lg"
          >
            Update Configuration
          </button>
        </div>
      }
    >
      <div className="space-y-12 pb-4">

        {/* PLANS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS_DATA.map((plan) => {
            const isPopular = plan.tag === 'POPULAR';
            return (
              <div
                key={plan.id}
                className={`p-8 rounded-3xl border transition-all flex flex-col group ${isPopular ? 'bg-stone-900 text-white border-stone-800 shadow-xl scale-105 z-10' : 'bg-white border-stone-200 hover:shadow-lg'}`}
              >
                <h3
                  className={`font-bold text-lg mb-1 tracking-tight ${isPopular ? 'text-white' : 'text-stone-900'}`}
                >
                  {plan.name}
                </h3>
                <div
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border w-fit mb-4 ${isPopular ? 'bg-stone-800 border-stone-700 text-gold-gradient' : 'bg-stone-50 border-stone-100 text-stone-500'}`}
                >
                  {plan.id === 'vip' ? 'Custom Tailored' : `${plan.includedCredits.toLocaleString()} ArmoCredits™`}
                </div>
                <div className="mb-4">
                  <div
                    className={`text-3xl font-bold ${isPopular ? 'text-white' : 'text-stone-900'}`}
                  >
                    {plan.price}
                  </div>
                  <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">
                    {plan.period}
                  </p>
                </div>

                <div className="mb-8 p-3 rounded-xl bg-stone-50/50 border border-stone-100/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                      Pay-per-use
                    </span>
                    <span className="text-[9px] font-bold text-gold-start">€1 / 1k extra</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                      Auto-Top-Up
                    </span>
                    <span className="text-[9px] font-bold text-green-500">Active</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8 flex-1">
                  {plan.features.slice(0, 5).map((feature: string, i: number) => (
                    <div key={i} className="flex gap-2 text-xs text-stone-500">
                      <CheckCircle2
                        size={14}
                        className={`${isPopular ? 'text-gold-start' : 'text-stone-300'} shrink-0 mt-0.5`}
                      />
                      <span className={isPopular ? 'text-stone-300' : ''}>{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSelectPlan(plan.stripePriceId, plan)}
                  disabled={buying || !plan.stripePriceId || currentPlanId === plan.id}
                  className={`w-full py-3 font-bold rounded-xl text-[10px] uppercase tracking-widest transition-all ${isPopular
                    ? 'bg-white text-stone-900 hover:bg-stone-50'
                    : currentPlanId === plan.id
                      ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                      : 'bg-stone-900 text-white hover:bg-stone-800 shadow-md'
                    } disabled:opacity-50`}
                >
                  {buying ? 'Redirecting...' : currentPlanId === plan.id ? 'Current Plan' : plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* CONSUMPTION SPARKLINE - REMOVED TO REDUCE BUNDLE SIZE */}
        <div className="bg-stone-50 p-8 rounded-2xl border border-stone-100">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest mb-1">
                Consumption Trace
              </h3>
              <p className="text-xs text-stone-500">System governance volume is monitored in real-time.</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> System Stable
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};
