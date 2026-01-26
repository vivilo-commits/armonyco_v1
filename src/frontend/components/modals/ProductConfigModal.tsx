import React, { useState } from 'react';
import { BaseModal } from '@/frontend/components/design-system/BaseModal';
import { FormField, AppButton } from '@/frontend/components/design-system';
import { Clock, MessageSquare, Repeat, Calendar, Shield } from 'lucide-react';

interface ProductConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    onSave: (config: any) => void;
}

export const ProductConfigModal: React.FC<ProductConfigModalProps> = ({
    isOpen,
    onClose,
    product,
    onSave,
}) => {
    const [template, setTemplate] = useState(product?.template || product?.defaultTemplate || '');
    const [hoursBefore, setHoursBefore] = useState(product?.hoursBefore || '24');
    const [frequency, setFrequency] = useState(product?.frequency || '1');
    const [checkInTime, setCheckInTime] = useState('15:00');
    const [checkOutTime, setCheckOutTime] = useState('10:00');

    const handleSave = () => {
        onSave({
            template,
            hoursBefore,
            frequency,
            checkInTime,
            checkOutTime,
        });
        onClose();
    };

    if (!product) return null;

    const hasTemplate = !['Autonomous Chat', 'Global Shield'].includes(product.name);

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Configure ${product.name}`}
            subtitle="Define operational rules and interaction templates."
            icon={<MessageSquare size={24} />}
            maxWidth="max-w-3xl"
        >
            <div className="space-y-8 py-4">
                {/* Timing Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2">
                            <Calendar size={14} className="text-gold-start" /> Property Standards
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                label="Check-in Hour"
                                type="time"
                                value={checkInTime}
                                onChange={(e) => setCheckInTime(e.target.value)}
                                icon={Clock}
                            />
                            <FormField
                                label="Check-out Hour"
                                type="time"
                                value={checkOutTime}
                                onChange={(e) => setCheckOutTime(e.target.value)}
                                icon={Clock}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={14} className="text-gold-start" /> Automation Logic
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                label="Hours Before"
                                type="number"
                                value={hoursBefore}
                                onChange={(e) => setHoursBefore(e.target.value)}
                                placeholder="24"
                            />
                            <FormField
                                label="Frequency"
                                type="number"
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                                icon={Repeat}
                            />
                        </div>
                    </div>
                </div>

                {/* Template Configuration */}
                {hasTemplate && (
                    <div className="space-y-4 pt-6 border-t border-stone-100">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold text-stone-900 uppercase tracking-widest flex items-center gap-2">
                                <MessageSquare size={14} className="text-gold-start" /> Communication Template
                            </h4>
                            <span className="text-[10px] text-stone-400 font-mono">Use {'{guest_name}'}, {'{check_in}'} etc.</span>
                        </div>
                        <textarea
                            className="w-full h-48 p-6 bg-stone-50 border border-stone-100 rounded-[2rem] text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-gold-start/20 placeholder:text-stone-300 resize-none transition-all shadow-inner"
                            placeholder="Hi {guest_name}, welcome to your home away from home..."
                            value={template}
                            onChange={(e) => setTemplate(e.target.value)}
                        />
                    </div>
                )}

                {!hasTemplate && (
                    <div className="p-8 bg-gold-start/5 border border-gold-start/10 rounded-[2.5rem] flex items-center gap-6">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-gold-start shadow-sm shrink-0">
                            <Shield size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-1">Autonomous Orchestration</p>
                            <p className="text-xs text-stone-500 leading-relaxed">
                                This routine uses live cognitive depth. No template required as the system generates contextually verified responses.
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-6 border-t border-stone-100">
                    <AppButton variant="secondary" onClick={onClose}>
                        Discard
                    </AppButton>
                    <AppButton variant="primary" onClick={handleSave}>
                        Apply Logic
                    </AppButton>
                </div>
            </div>
        </BaseModal>
    );
};
