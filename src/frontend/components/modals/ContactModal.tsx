import React, { useState } from 'react';
import { BaseModal } from '../design-system/BaseModal';
import { Mail, MessageSquare, Phone, Send, Globe, CheckCircle, AlertCircle } from 'lucide-react';
import { submitGetInTouch } from '@/backend/n8n-client';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const result = await submitGetInTouch(formState);

      if (result.success) {
        setSubmitStatus('success');
        // Clear form after 2 seconds and close modal
        setTimeout(() => {
          setFormState({ name: '', email: '', company: '', message: '' });
          setSubmitStatus('idle');
          onClose();
        }, 2000);
      } else {
        setSubmitStatus('error');
        setErrorMessage(result.error || 'Failed to submit form');
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Strategic Alignment"
      subtitle="Institutional Inquiries & Partnerships"
      maxWidth="max-w-4xl"
      icon={<MessageSquare size={24} />}
    >
      <div className="grid grid-cols-1 md:grid-cols-5 gap-10 py-6">
        {/* Contact Info Sidebar */}
        <div className="md:col-span-2 space-y-10">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-gold-mid-2 uppercase tracking-[0.2em]">
              Global Presence
            </h4>
            <div className="space-y-6">
              <button
                type="button"
                className="flex items-start gap-4 group cursor-pointer text-left"
                onClick={() => window.open('mailto:institutional@armonyco.ai')}
              >
                <div className="p-2 rounded-lg bg-stone-50 text-stone-400 group-hover:text-gold-start transition-colors border border-stone-100">
                  <Mail size={16} />
                </div>
                <div>
                  <div className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">
                    Email
                  </div>
                  <div className="text-sm text-stone-600">institutional@armonyco.ai</div>
                </div>
              </button>
              <div className="flex items-start gap-4 group">
                <div className="p-2 rounded-lg bg-stone-50 text-stone-400 group-hover:text-gold-start transition-colors border border-stone-100">
                  <Phone size={16} />
                </div>
                <div>
                  <div className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">
                    Global Line
                  </div>
                  <div className="text-sm text-stone-600">+44 20 3835 1200</div>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="p-2 rounded-lg bg-stone-50 text-stone-400 group-hover:text-gold-start transition-colors border border-stone-100">
                  <Globe size={16} />
                </div>
                <div>
                  <div className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">
                    Network
                  </div>
                  <div className="text-sm text-stone-600 text-gold-start/80">
                    DecisionOS™ Verified Nodes
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-100 space-y-3">
            <p className="text-xs text-stone-500 font-light leading-relaxed italic">
              &ldquo;We don&apos;t sell software. We align with organizations demanding structural
              governance.&rdquo;
            </p>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="md:col-span-3 space-y-8">
          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-3">
              <label
                htmlFor="contact-name"
                className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1"
              >
                Full Name
              </label>
              <input
                id="contact-name"
                required
                type="text"
                placeholder="Institutional Lead"
                className="w-full bg-stone-50 border border-stone-100 rounded-xl px-5 py-4 text-sm text-stone-900 focus:border-gold-start focus:ring-1 focus:ring-gold-start/20 transition-all outline-none"
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label
                  htmlFor="contact-email"
                  className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1"
                >
                  Work Email
                </label>
                <input
                  id="contact-email"
                  required
                  type="email"
                  placeholder="name@company.com"
                  className="w-full bg-stone-50 border border-stone-100 rounded-xl px-5 py-4 text-sm text-stone-900 focus:border-gold-start focus:ring-1 focus:ring-gold-start/20 transition-all outline-none"
                  value={formState.email}
                  onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label
                  htmlFor="contact-company"
                  className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1"
                >
                  Organization
                </label>
                <input
                  id="contact-company"
                  required
                  type="text"
                  placeholder="Entity Name"
                  className="w-full bg-stone-50 border border-stone-100 rounded-xl px-5 py-4 text-sm text-stone-900 focus:border-gold-start focus:ring-1 focus:ring-gold-start/20 transition-all outline-none"
                  value={formState.company}
                  onChange={(e) => setFormState({ ...formState, company: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-3">
              <label
                htmlFor="contact-message"
                className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1"
              >
                Requirement Overview
              </label>
              <textarea
                id="contact-message"
                required
                rows={4}
                placeholder="Describe your operational governance needs..."
                className="w-full bg-stone-50 border border-stone-100 rounded-xl px-5 py-4 text-sm text-stone-900 focus:border-gold-start focus:ring-1 focus:ring-gold-start/20 transition-all outline-none resize-none"
                value={formState.message}
                onChange={(e) => setFormState({ ...formState, message: e.target.value })}
              />
            </div>
          </div>

          {/* Success/Error Feedback */}
          {submitStatus === 'success' && (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-in fade-in zoom-in duration-300">
              <CheckCircle size={20} className="text-emerald-500" />
              <p className="text-sm font-bold text-emerald-700">
                Request sent successfully! Our team will contact you soon.
              </p>
            </div>
          )}
          {submitStatus === 'error' && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-in fade-in zoom-in duration-300">
              <AlertCircle size={20} className="text-red-500" />
              <p className="text-sm font-bold text-red-700">
                {errorMessage || 'Failed to submit. Please try again.'}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || submitStatus === 'success'}
            className="w-full gold-gradient text-stone-900 font-bold text-[11px] uppercase tracking-[0.2em] py-5 rounded-xl shadow-gold-glow hover:shadow-gold-glow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-stone-900/20 border-t-stone-900 rounded-full animate-spin" />
                Sending...
              </>
            ) : submitStatus === 'success' ? (
              <>
                <CheckCircle size={16} />
                Sent Successfully
              </>
            ) : (
              <>
                Submit Request{' '}
                <Send size={16} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </BaseModal>
  );
};
