import React from 'react';
import { BaseModal } from '../design-system/BaseModal';
import { AlertCircle, Zap, CreditCard, ChevronRight } from 'lucide-react';

interface LowBalanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    balance: number;
    onRecharge: () => void;
}

export const LowBalanceModal: React.FC<LowBalanceModalProps> = ({
    isOpen,
    onClose,
    balance,
    onRecharge
}) => {
    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Operational Capacity Alert"
            subtitle="Low Credit Balance Detected"
            icon={<AlertCircle size={24} className="text-amber-500" />}
        >
            <div className="space-y-6 py-4">
                {/* Warning Banner */}
                <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex items-start gap-4">
                    <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-serif text-amber-900 mb-1">Critical Balance</h3>
                        <p className="text-amber-700 text-sm leading-relaxed">
                            Your Armo Credit balance is currently <span className="font-bold">{balance.toLocaleString()}</span>.
                            At your current consumption rate, you may lose operational capacity within the next 4 hours.
                        </p>
                    </div>
                </div>

                {/* Impact Message */}
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-stone-50 border border-stone-100">
                        <h4 className="text-[10px] text-stone-500 uppercase tracking-widest font-bold mb-2">Impact if balance reaches zero:</h4>
                        <ul className="space-y-2">
                            {[
                                'Automated guest check-in will pause',
                                'Intelligence mode will downgrade to Basic',
                                'Human escalations may not be prioritized',
                                'Data sync with PMS may be delayed'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-2 text-xs text-stone-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Recommendation */}
                <div className="bg-stone-900 p-6 rounded-2xl text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Zap size={20} className="text-gold-mid-2 fill-gold-mid-2" />
                            <span className="text-sm font-bold uppercase tracking-widest">Recommended Action</span>
                        </div>
                        <span className="text-[10px] text-stone-400 font-mono">EST: 2 MIN</span>
                    </div>
                    <p className="text-stone-300 text-xs mb-6 leading-relaxed">
                        Recharge 120,000 credits now and enable Auto Top-up to ensure 24/7 continuity.
                        This will cover your operations for approximately 30 days.
                    </p>
                    <button
                        onClick={() => {
                            onRecharge();
                            onClose();
                        }}
                        className="w-full py-4 gold-gradient text-stone-900 rounded-xl font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-gold-glow"
                    >
                        <CreditCard size={16} />
                        Recharge & Secure System
                        <ChevronRight size={16} />
                    </button>
                </div>

                <div className="flex justify-center flex-col items-center gap-3">
                    <button
                        onClick={onClose}
                        className="text-[10px] text-stone-400 uppercase tracking-widest hover:text-stone-600 transition-colors font-bold"
                    >
                        Dismiss for 30 minutes
                    </button>
                    <p className="text-[8px] text-stone-300 font-mono uppercase">
                        Governed by DecisionOS™ Integrity Layer
                    </p>
                </div>
            </div>
        </BaseModal>
    );
};
