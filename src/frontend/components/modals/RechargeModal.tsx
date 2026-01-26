import React, { useState } from 'react';
import { BaseModal } from '../design-system/BaseModal';
import { Zap, CreditCard, Check } from 'lucide-react';
import { api } from '@/backend/api';

interface RechargeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    currentBalance: number;
    autoTopupEnabled?: boolean;
}

export const RechargeModal: React.FC<RechargeModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    currentBalance,
    autoTopupEnabled: initialAutoTopup
}) => {
    const [loading, setLoading] = useState(false);
    const [selectedPack, setSelectedPack] = useState<number | null>(100);
    const [autoTopup, setAutoTopup] = useState(initialAutoTopup || false);

    const packs = [
        { credits: 50000, price: 50, label: 'Starter', desc: 'Ideal for small properties' },
        { credits: 120000, price: 100, label: 'Professional', desc: 'Most popular for growing hotels', popular: true },
        { credits: 350000, price: 250, label: 'Business', desc: 'Maximum efficiency for large operations' },
    ];

    const handleRecharge = async () => {
        if (!selectedPack) return;
        setLoading(true);
        try {
            // In production, this would redirect to Stripe or call an edge function
            // For this implementation, we simulate the credit addition via the API 
            // (or actually call a mock endpoint if available)

            // Let's assume we update auto-topup settings first if changed
            if (autoTopup !== initialAutoTopup) {
                await api.updateAutoTopup(autoTopup, 10000, 100000);
            }

            // Simulate Stripe redirect delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            alert('Secure Stripe Session created. (Simulated)');
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Recharge failed:', error);
            alert('Recharge failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Recharge Armo Credits"
            subtitle="Fuel your operational intelligence"
            icon={<Zap size={24} className="text-gold-mid-2" />}
        >
            <div className="space-y-6 py-2">
                {/* Current Status */}
                <div className="flex items-center justify-between p-4 bg-stone-50 rounded-xl border border-stone-100">
                    <div>
                        <p className="text-[10px] text-stone-400 uppercase tracking-widest font-mono">Current Balance</p>
                        <p className="text-xl font-serif text-stone-900">{currentBalance.toLocaleString()} Credits</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-stone-400 uppercase tracking-widest font-mono">Capacity</p>
                        <p className="text-sm font-medium text-emerald-600">Active</p>
                    </div>
                </div>

                {/* Pack Selection */}
                <div className="space-y-3">
                    <p className="text-[10px] text-stone-500 uppercase tracking-widest font-bold px-1">Select Credit Pack</p>
                    <div className="grid grid-cols-1 gap-3">
                        {packs.map((pack) => (
                            <button
                                key={pack.credits}
                                onClick={() => setSelectedPack(pack.price)}
                                className={`relative flex items-center justify-between p-4 rounded-xl border transition-all text-left ${selectedPack === pack.price
                                    ? 'border-gold-mid-2 bg-gold-start/5 shadow-sm'
                                    : 'border-stone-100 bg-white hover:border-stone-200'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${selectedPack === pack.price ? 'bg-gold-mid-2 text-stone-900' : 'bg-stone-50 text-stone-400'}`}>
                                        <Zap size={18} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-stone-900">{pack.credits.toLocaleString()} Credits</p>
                                            {pack.popular && (
                                                <span className="text-[8px] bg-stone-900 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">Popular</span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-stone-500">{pack.desc}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-serif text-stone-900">€{pack.price}</p>
                                    {selectedPack === pack.price && <Check size={16} className="text-gold-mid-2 ml-auto mt-1" />}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Auto Top-up Toggle */}
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-stone-100">
                            <Zap size={18} className={autoTopup ? 'text-gold-mid-2' : 'text-stone-300'} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-stone-900">Auto Top-up</p>
                            <p className="text-[10px] text-stone-500">Automatically recharge when below 10k credits</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setAutoTopup(!autoTopup)}
                        className={`w-10 h-5 rounded-full transition-all relative ${autoTopup ? 'bg-stone-900' : 'bg-stone-200'}`}
                    >
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${autoTopup ? 'right-1' : 'left-1'}`} />
                    </button>
                </div>

                {/* Action */}
                <div className="pt-2">
                    <button
                        onClick={handleRecharge}
                        disabled={loading || !selectedPack}
                        className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-stone-800 transition-all disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <CreditCard size={16} />
                                Secure Checkout €{selectedPack}
                            </>
                        )}
                    </button>
                    <p className="text-[9px] text-stone-400 text-center mt-3 flex items-center justify-center gap-1">
                        <Check size={10} /> Secure payment via Stripe. Tax included.
                    </p>
                </div>
            </div>
        </BaseModal>
    );
};
