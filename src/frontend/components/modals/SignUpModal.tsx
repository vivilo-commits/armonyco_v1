import React, { useState } from 'react';
import {
  Mail,
  ArrowRight,
  Building2,
  User,
  Phone,
  ShieldCheck,
  CreditCard,
  ChevronLeft,
  Lock,
  MapPin,
  Globe,
} from 'lucide-react';
import { BaseModal } from '../design-system/BaseModal';
import { FormField } from '../design-system/FormField';
import { PLANS_DATA } from '@/frontend/constants';
import { supabase } from '@/database/supabase';
import { ASSETS } from '@/frontend/assets';
import { stripeApi } from '@/backend/stripe-api';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'COMPANY' | 'USER' | 'PLAN' | 'PAYMENT';

export const SignUpModal: React.FC<SignUpModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<Step>('COMPANY');
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Company & Billing
    companyName: '',
    vatNumber: '',
    billingStreet: '',
    billingCity: '',
    billingPostal: '',
    billingCountry: 'IT',
    // Account
    email: '',
    password: '',
    confirmPassword: '',
    // User
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [selectedPlan, setSelectedPlan] = useState(PLANS_DATA[1].id); // Default to PRO

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    if (step === 'COMPANY') setStep('USER');
    else if (step === 'USER') setStep('PLAN');
    else if (step === 'PLAN') setStep('PAYMENT');
  };

  const prevStep = () => {
    if (step === 'USER') setStep('COMPANY');
    else if (step === 'PLAN') setStep('USER');
    else if (step === 'PAYMENT') setStep('PLAN');
  };

  const [error, setError] = useState<string | null>(null);

  const handleFinalize = async () => {
    setLoading(true);
    setError(null);
    try {
      // Step 1: Create user account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            company_name: formData.companyName,
            vat_number: formData.vatNumber,
            phone: formData.phone,
            billing_address: {
              street: formData.billingStreet,
              city: formData.billingCity,
              postal: formData.billingPostal,
              country: formData.billingCountry,
            },
            selected_plan: selectedPlan,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error('User creation failed');

      // Step 2: Retrieve organization_id created by handle_new_user trigger
      // Wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      const { data: orgMember, error: orgError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', signUpData.user.id)
        .single();

      if (orgError || !orgMember) {
        throw new Error('Failed to retrieve organization assignment');
      }

      // Step 3: Get selected plan details
      const selectedPlanData = PLANS_DATA.find(p => p.id === selectedPlan);
      if (!selectedPlanData || !selectedPlanData.stripePriceId) {
        throw new Error('Invalid plan selected');
      }

      // Step 4: Create Stripe Checkout Session
      const checkoutSession = await stripeApi.createCheckoutSession({
        priceId: selectedPlanData.stripePriceId,
        organizationId: orgMember.organization_id,
        email: formData.email,
        planId: selectedPlan,
        planName: selectedPlanData.name,
        mode: 'subscription',
        credits: selectedPlanData.includedCredits
      });

      // Step 5: Redirect to Stripe Checkout
      if (checkoutSession.url) {
        window.location.href = checkoutSession.url;
      } else {
        throw new Error('Failed to create checkout session');
      }

    } catch (err: unknown) {
      const authError = err as { message: string };
      setError(authError.message || 'Registration failed');
      console.error('Signup error:', err);
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {(['COMPANY', 'USER', 'PLAN', 'PAYMENT'] as Step[]).map((s, idx) => (
        <React.Fragment key={s}>
          <div
            className={`w-2 h-2 rounded-full transition-all duration-300 ${step === s
              ? 'gold-gradient shadow-gold-glow w-6'
              : ['COMPANY', 'USER', 'PLAN', 'PAYMENT'].indexOf(step) > idx
                ? 'bg-stone-900'
                : 'bg-stone-200'
              }`}
          />
        </React.Fragment>
      ))}
    </div>
  );

  const activePlan = PLANS_DATA.find((p) => p.id === selectedPlan) || PLANS_DATA[1];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        step === 'COMPANY'
          ? 'Start Operating'
          : step === 'USER'
            ? 'Master Identity'
            : step === 'PLAN'
              ? 'Governance Tier'
              : 'Activation'
      }
      subtitle={
        step === 'COMPANY'
          ? 'Initialize your DecisionOS™ node with company credentials.'
          : step === 'USER'
            ? 'Define the primary authority for this governance layer.'
            : step === 'PLAN'
              ? 'Choose the scale of your autonomous operations.'
              : `Secure activation for ${activePlan.name}.`
      }
      maxWidth={step === 'PLAN' ? 'max-w-4xl' : 'max-w-xl'}
      footer={
        <div className="w-full flex justify-between items-center py-2 px-6 border-t border-stone-100">
          <p className="text-[9px] text-stone-400 uppercase tracking-[0.2em] font-bold">
            Step {step === 'COMPANY' ? '1' : step === 'USER' ? '2' : step === 'PLAN' ? '3' : '4'} of
            4
          </p>
          <div className="flex items-center gap-2 text-stone-400">
            <ShieldCheck size={12} />
            <span className="text-[9px] uppercase font-bold tracking-widest">
              Fiduciary Grade Security
            </span>
          </div>
        </div>
      }
    >
      <div className="animate-in">
        {/* Modal Header/Logo */}
        <div className="flex flex-col items-center gap-6 mb-12">
          <img src={ASSETS.logos.full} alt="Armonyco" className="h-14 w-auto" />
        </div>
        {renderStepIndicator()}

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2 animate-in fade-in duration-300">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {error}
          </div>
        )}

        {step === 'COMPANY' && (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <FormField
              label="Company Legal Name"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              placeholder="Acme Corporation S.r.l."
              icon={Building2}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="VAT / Tax ID"
                name="vatNumber"
                value={formData.vatNumber}
                onChange={handleInputChange}
                placeholder="IT12345678901"
                required
              />
              <div className="space-y-1.5">
                <label
                  htmlFor="billingCountry"
                  className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 ml-1"
                >
                  Country <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <Globe
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-900 transition-colors"
                    size={16}
                  />
                  <select
                    id="billingCountry"
                    name="billingCountry"
                    value={formData.billingCountry}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setFormData((prev) => ({ ...prev, billingCountry: e.target.value }))
                    }
                    className="w-full bg-stone-50 border border-stone-200 text-stone-900 text-sm rounded-xl focus:ring-1 focus:ring-stone-900 focus:border-stone-900 block pl-10 p-3 transition-all outline-none appearance-none"
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

            <div>
              <label
                htmlFor="billingAddress"
                className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2 ml-1"
              >
                Billing Address
              </label>
              <FormField
                label="Street"
                name="billingStreet"
                value={formData.billingStreet}
                onChange={handleInputChange}
                placeholder="Via Roma, 123"
                icon={MapPin}
                required
                className="mb-3"
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="City"
                  name="billingCity"
                  value={formData.billingCity}
                  onChange={handleInputChange}
                  placeholder="Milan"
                  required
                />
                <FormField
                  label="Postal Code"
                  name="billingPostal"
                  value={formData.billingPostal}
                  onChange={handleInputChange}
                  placeholder="20121"
                  required
                />
              </div>
            </div>

            <FormField
              label="Corporate Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="admin@company.com"
              icon={Mail}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                icon={Lock}
                required
              />
              <FormField
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                required
              />
            </div>

            {formData.password &&
              formData.confirmPassword &&
              formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-600 ml-1">Passwords do not match</p>
              )}

            <button
              onClick={nextStep}
              disabled={
                !formData.companyName ||
                !formData.email ||
                !formData.vatNumber ||
                !formData.billingStreet ||
                !formData.billingCity ||
                !formData.billingPostal ||
                !formData.password ||
                !formData.confirmPassword ||
                formData.password !== formData.confirmPassword
              }
              className="w-full text-white bg-stone-900 hover:bg-stone-800 font-bold rounded-xl text-xs uppercase tracking-widest py-4 text-center flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              Next Step <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 'USER' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            {/* Admin Notice */}
            <div className="bg-gold-start/5 border border-gold-start/20 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gold-start/20 rounded-lg flex items-center justify-center shrink-0">
                  <ShieldCheck size={16} className="text-gold-start" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 mb-1">Administrator Account</h4>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    This is your <span className="font-bold">Administrator</span> account with{' '}
                    <span className="font-bold">full permissions</span>. To create users with
                    limited access, navigate to{' '}
                    <span className="font-semibold">Settings → Team</span> after setup.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Admin"
                icon={User}
              />
              <FormField
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="User"
              />
            </div>

            <FormField
              label="Direct Phone Line"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+1 (555) 000-0000"
              icon={Phone}
            />

            <div className="flex gap-4 mt-8">
              <button
                onClick={prevStep}
                className="flex-1 bg-white border border-stone-200 text-stone-600 font-bold rounded-xl text-xs uppercase tracking-widest py-4 hover:bg-stone-50 transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <button
                onClick={nextStep}
                disabled={!formData.firstName || !formData.lastName || !formData.phone}
                className="flex-[2] text-white bg-stone-900 hover:bg-stone-800 font-bold rounded-xl text-xs uppercase tracking-widest py-4 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Continue to Plans <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 'PLAN' && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {PLANS_DATA.map((plan) => {
                const isVIP = plan.id === 'enterprise';
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-5 rounded-2xl border text-left transition-all ${selectedPlan === plan.id
                      ? 'border-gold-start gold-gradient text-stone-900 shadow-xl scale-[1.02]'
                      : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300'
                      }`}
                  >
                    <div className="mb-4">
                      <div
                        className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${selectedPlan === plan.id ? 'text-stone-900/60' : 'text-stone-400'}`}
                      >
                        {plan.tag}
                      </div>
                      <h4 className="text-base font-bold tracking-tight">{plan.name}</h4>
                      <div
                        className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${selectedPlan === plan.id ? 'text-stone-400' : 'text-stone-400'}`}
                      >
                        {plan.units}
                      </div>
                    </div>
                    <div className="mb-4">
                      <span
                        className={`text-xl font-bold ${selectedPlan === plan.id ? 'text-stone-900' : 'text-stone-900'}`}
                      >
                        {plan.price}
                      </span>
                      {!isVIP && (
                        <span className="text-[9px] uppercase font-bold tracking-widest ml-1 opacity-50">
                          / mo
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-[10px] font-semibold ${selectedPlan === plan.id ? 'text-stone-300' : 'text-stone-500'}`}
                    >
                      {isVIP
                        ? 'Bespoke tailored'
                        : `${plan.includedCredits.toLocaleString()} ArmoCredits™`}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-4 mt-8 max-w-xl mx-auto">
              <button
                onClick={prevStep}
                className="flex-1 bg-white border border-stone-200 text-stone-600 font-bold rounded-xl text-xs uppercase tracking-widest py-4 hover:bg-stone-50 transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <button
                onClick={nextStep}
                className="flex-[2] text-white bg-stone-900 hover:bg-stone-800 font-bold rounded-xl text-xs uppercase tracking-widest py-4 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                Proceed to Activation <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 'PAYMENT' && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 max-w-xl mx-auto">
            <div className="bg-stone-900 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 gold-gradient opacity-10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <CreditCard size={20} className="text-gold-start" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-widest">
                      Stripe Secure Activation
                    </h4>
                    <p className="text-[10px] text-stone-400 font-medium">{activePlan.name}</p>
                  </div>
                </div>

                <div className="space-y-4 py-8 border-y border-white/5 my-6 flex flex-col items-center justify-center text-stone-400 text-sm">
                  <CreditCard size={48} className="opacity-20 mb-2" />
                  <p className="text-xs font-medium">
                    Secure checkout powered by Stripe
                  </p>
                  <p className="text-[10px] uppercase tracking-widest opacity-50 font-bold">
                    {formData.companyName}
                  </p>
                </div>

                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                  <span className="text-stone-400">Governance Tier Monthly</span>
                  <span className="text-gold-gradient font-bold">{activePlan.price} / mo</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={prevStep}
                className="flex-1 bg-white border border-stone-200 text-stone-600 font-bold rounded-xl text-xs uppercase tracking-widest py-4 hover:bg-stone-50 transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <button
                onClick={handleFinalize}
                disabled={loading}
                className="flex-[2] text-stone-900 gold-gradient hover:opacity-90 font-bold rounded-xl text-xs uppercase tracking-widest py-4 shadow-gold-glow hover:shadow-gold-glow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Activating Matrix...' : `Activate ${activePlan.name}`}{' '}
                <ShieldCheck size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
};
