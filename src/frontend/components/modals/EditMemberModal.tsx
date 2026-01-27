import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { AppButton, FormField, BaseModal } from '../design-system';

interface EditMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: {
        id: string;
        user_id: string;
        role: string;
        profiles: {
            full_name: string | null;
            email: string | null;
        } | null;
    } | null;
    onSave: (memberId: string, updates: { role?: string; full_name?: string }) => Promise<void>;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
    isOpen,
    onClose,
    member,
    onSave,
}) => {
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('viewer');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (member) {
            setFullName(member.profiles?.full_name || '');
            setRole(member.role || 'viewer');
        }
    }, [member]);

    const handleSave = async () => {
        if (!member) return;
        setSaving(true);
        try {
            await onSave(member.id, { role, full_name: fullName });
            onClose();
        } catch (e) {
            console.error('Failed to update member:', e);
        } finally {
            setSaving(false);
        }
    };

    const isOwnerRole = member?.role === 'owner';

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Team Member"
            subtitle="Manage identity and access levels for your team."
            icon={<Users size={20} />}
            footer={
                <div className="flex gap-3 w-full">
                    <AppButton variant="secondary" onClick={onClose} className="flex-1">
                        Cancel
                    </AppButton>
                    <AppButton
                        variant="primary"
                        onClick={handleSave}
                        loading={saving}
                        className="flex-1"
                    >
                        Save Changes
                    </AppButton>
                </div>
            }
        >
            <div className="space-y-6">
                <FormField
                    label="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                />

                <FormField
                    label="Email (read-only)"
                    value={member?.profiles?.email || 'No email provided'}
                    onChange={() => { }}
                    placeholder="Email"
                    disabled
                />

                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                        System Permissions Role
                    </label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        disabled={isOwnerRole}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium focus:outline-none ring-stone-900 focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <option value="owner">Owner (Full System Access)</option>
                        <option value="manager">Manager (Guest Management)</option>
                        <option value="viewer">Viewer (Read-only)</option>
                    </select>
                    {isOwnerRole && (
                        <p className="text-[10px] text-stone-400 font-medium italic">
                            The primary Owner role is fixed and cannot be modified.
                        </p>
                    )}
                </div>
            </div>
        </BaseModal>
    );
};
