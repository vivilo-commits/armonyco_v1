import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/database/supabase';
import { useAuth } from '@/frontend/contexts/AuthContext';
import { Plus, Trash2, Loader2, Building2, ExternalLink } from 'lucide-react';
import { AppButton, AppBadge } from '@/frontend/components/design-system';

interface Property {
    id: string;
    organization_id: string;
    short_name: string | null;
    marketing_name: string | null;
    unit_reference: string | null;
    brand_complex: string | null;
    unit_category: string | null;
    city: string | null;
    neighborhood: string | null;
    address: string | null;
    floor: string | null;
    zip_code: string | null;
    state_region: string | null;
    latitude: number | null;
    longitude: number | null;
    google_maps_url: string | null;
    description_short: string | null;
    description_long: string | null;
    surface_area: number | null;
    has_elevator: boolean | null;
    max_guests: number | null;
    bedroom_count: number | null;
    bed_count: number | null;
    extra_bed_count: number | null;
    bathroom_count: number | null;
    has_hot_tub: boolean | null;
    has_crib: boolean | null;
    accessibility_notes: string | null;
    check_in_time: string | null;
    check_out_time: string | null;
    late_check_in_window: string | null;
    late_check_in_fee: number | null;
    late_check_out_notes: string | null;
    has_self_check_in: boolean | null;
    access_method: string | null;
    street_gate_code: string | null;
    building_gate_code: string | null;
    property_access_code: string | null;
    unit_key_info: string | null;
    city_tax_amount: number | null;
    city_tax_type: string | null;
    wifi_name: string | null;
    wifi_password: string | null;
    security_deposit: number | null;
    pets_allowed: boolean | null;
    smoking_allowed: boolean | null;
    parties_allowed: boolean | null;
    quiet_hours: string | null;
    breakfast_info: string | null;
    has_ac: boolean | null;
    has_heating: boolean | null;
    has_tv: boolean | null;
    has_kitchen: boolean | null;
    has_washer: boolean | null;
    has_dishwasher: boolean | null;
    has_coffee_machine: boolean | null;
    has_fridge: boolean | null;
    has_oven: boolean | null;
    has_microwave: boolean | null;
    has_kettle: boolean | null;
    has_linens: boolean | null;
    has_towels: boolean | null;
    has_hair_dryer: boolean | null;
    has_iron: boolean | null;
    has_first_aid_kit: boolean | null;
    has_smoke_detector: boolean | null;
    has_co_detector: boolean | null;
    has_fire_extinguisher: boolean | null;
    has_balcony: boolean | null;
    view_description: string | null;
    parking_info: string | null;
    shuttle_service: string | null;
    languages_spoken: string[] | null;
    neighborhood_directions: string | null;
    is_service_active: boolean | null;
    created_at: string;
}

const COLUMN_GROUPS = [
    {
        title: 'Core Identity',
        color: 'bg-stone-50 border-stone-200 text-stone-900',
        columns: [
            { key: 'is_service_active', label: 'Service Active', type: 'boolean', width: '120px' },
            { key: 'short_name', label: 'Short Name', type: 'text', width: '200px' },
            { key: 'marketing_name', label: 'Marketing Name', type: 'text', width: '250px' },
            { key: 'unit_reference', label: 'Unit/Room #', type: 'text', width: '120px' },
            { key: 'brand_complex', label: 'Brand/Complex', type: 'text', width: '180px' },
            { key: 'unit_category', label: 'Unit Category', type: 'text', width: '150px' },
        ]
    },
    {
        title: 'Location & Geography',
        color: 'bg-stone-50 border-stone-200 text-stone-900',
        columns: [
            { key: 'address', label: 'Full Address', type: 'text', width: '300px' },
            { key: 'city', label: 'City', type: 'text', width: '150px' },
            { key: 'zip_code', label: 'Postal Code', type: 'text', width: '100px' },
            { key: 'neighborhood', label: 'Neighborhood', type: 'text', width: '180px' },
            { key: 'floor', label: 'Floor Level', type: 'text', width: '100px' },
            { key: 'state_region', label: 'State/Region', type: 'text', width: '150px' },
            { key: 'google_maps_url', label: 'Maps Link', type: 'url', width: '100px' },
        ]
    },
    {
        title: 'Institutional Access',
        color: 'bg-stone-50 border-stone-200 text-stone-900',
        columns: [
            { key: 'check_in_time', label: 'Check-in Time', type: 'time', width: '120px' },
            { key: 'check_out_time', label: 'Check-out Time', type: 'time', width: '120px' },
            { key: 'has_self_check_in', label: 'Self Check-in', type: 'boolean', width: '120px' },
            { key: 'access_method', label: 'Access Method', type: 'text', width: '180px' },
            { key: 'street_gate_code', label: 'Street Code', type: 'text', width: '150px' },
            { key: 'building_gate_code', label: 'Staircase Code', type: 'text', width: '150px' },
            { key: 'property_access_code', label: 'Building Code', type: 'text', width: '150px' },
            { key: 'unit_key_info', label: 'Unit Key/Pin', type: 'text', width: '150px' },
        ]
    },
    {
        title: 'Connectivity & Financials',
        color: 'bg-stone-50 border-stone-200 text-stone-900',
        columns: [
            { key: 'wifi_name', label: 'WiFi Network', type: 'text', width: '180px' },
            { key: 'wifi_password', label: 'WiFi Password', type: 'text', width: '180px' },
            { key: 'city_tax_amount', label: 'City Tax (p.p.)', type: 'number', width: '130px' },
            { key: 'city_tax_type', label: 'Tax Payment Type', type: 'text', width: '150px' },
            { key: 'security_deposit', label: 'Deposit Amt', type: 'number', width: '120px' },
        ]
    },
    {
        title: 'Specifications',
        color: 'bg-stone-50 border-stone-200 text-stone-900',
        columns: [
            { key: 'max_guests', label: 'Max Guests', type: 'number', width: '100px' },
            { key: 'bedroom_count', label: 'Bedrooms', type: 'number', width: '90px' },
            { key: 'bed_count', label: 'Bed Count', type: 'number', width: '90px' },
            { key: 'extra_bed_count', label: 'Extra Beds', type: 'number', width: '90px' },
            { key: 'bathroom_count', label: 'Bathrooms', type: 'number', width: '90px' },
            { key: 'surface_area', label: 'Area (m²)', type: 'number', width: '90px' },
            { key: 'has_elevator', label: 'Elevator', type: 'boolean', width: '90px' },
            { key: 'has_hot_tub', label: 'Hot Tub', type: 'boolean', width: '90px' },
            { key: 'has_crib', label: 'Crib Avail.', type: 'boolean', width: '90px' },
        ]
    },
    {
        title: 'Standard Amenities',
        color: 'bg-stone-50 border-stone-200 text-stone-900',
        columns: [
            { key: 'has_ac', label: 'A/C', type: 'boolean', width: '70px' },
            { key: 'has_heating', label: 'Heating', type: 'boolean', width: '70px' },
            { key: 'has_tv', label: 'TV', type: 'boolean', width: '70px' },
            { key: 'has_kitchen', label: 'Kitchen', type: 'boolean', width: '70px' },
            { key: 'has_washer', label: 'Washer', type: 'boolean', width: '70px' },
            { key: 'has_dishwasher', label: 'Dishwasher', type: 'boolean', width: '70px' },
            { key: 'has_coffee_machine', label: 'Coffee', type: 'boolean', width: '70px' },
            { key: 'has_fridge', label: 'Fridge', type: 'boolean', width: '70px' },
            { key: 'has_oven', label: 'Oven', type: 'boolean', width: '70px' },
            { key: 'has_microwave', label: 'Microwave', type: 'boolean', width: '70px' },
            { key: 'has_kettle', label: 'Kettle', type: 'boolean', width: '70px' },
            { key: 'has_linens', label: 'Linens', type: 'boolean', width: '70px' },
            { key: 'has_towels', label: 'Towels', type: 'boolean', width: '70px' },
            { key: 'has_hair_dryer', label: 'Hair Dryer', type: 'boolean', width: '70px' },
            { key: 'has_iron', label: 'Iron', type: 'boolean', width: '70px' },
        ]
    },
    {
        title: 'Safety & Policy',
        color: 'bg-stone-50 border-stone-200 text-stone-900',
        columns: [
            { key: 'has_first_aid_kit', label: 'First Aid', type: 'boolean', width: '80px' },
            { key: 'has_smoke_detector', label: 'Smoke Det.', type: 'boolean', width: '80px' },
            { key: 'has_co_detector', label: 'CO Det.', type: 'boolean', width: '80px' },
            { key: 'has_fire_extinguisher', label: 'Fire Ext.', type: 'boolean', width: '80px' },
            { key: 'pets_allowed', label: 'Pets', type: 'boolean', width: '80px' },
            { key: 'smoking_allowed', label: 'Smoking', type: 'boolean', width: '80px' },
            { key: 'parties_allowed', label: 'Parties', type: 'boolean', width: '80px' },
            { key: 'quiet_hours', label: 'Quiet Hours', type: 'text', width: '150px' },
        ]
    }
];

export const PropertiesTable: React.FC = () => {
    const { organization, canEdit } = useAuth();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const tableRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (organization?.id) {
            fetchProperties();
        }
    }, [organization?.id]);

    const fetchProperties = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('organization_hotels')
                .select('*')
                .eq('organization_id', organization!.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProperties(data || []);
        } catch (e) {
            console.error('Failed to fetch properties:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleCellUpdate = async (id: string, key: string, value: any) => {
        // Optimistic update
        setProperties(prev => prev.map(p =>
            p.id === id ? { ...p, [key]: value } : p
        ));

        setSavingId(id);
        try {
            const { error } = await supabase
                .from('organization_hotels')
                .update({ [key]: value })
                .eq('id', id);

            if (error) throw error;
        } catch (e) {
            console.error('Update failed:', e);
            fetchProperties(); // Fallback: re-fetch
        } finally {
            setSavingId(null);
        }
    };

    const handleAddProperty = async () => {
        if (!organization?.id) return;
        try {
            const { data, error } = await supabase
                .from('organization_hotels')
                .insert([{
                    organization_id: organization.id,
                    short_name: 'New Asset',
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;
            setProperties([data, ...properties]);
        } catch (e) {
            console.error('Add failed:', e);
        }
    };

    const handleDeleteProperty = async (id: string) => {
        if (!confirm('This action cannot be undone. Are you sure you want to delete this property from the institutional portfolio?')) return;
        try {
            await supabase.from('organization_hotels').delete().eq('id', id);
            setProperties(properties.filter(p => p.id !== id));
        } catch (e) {
            console.error('Delete failed:', e);
        }
    };

    if (loading && properties.length === 0) {
        return (
            <div className="p-12 flex flex-col items-center justify-center gap-4 text-stone-400">
                <Loader2 className="animate-spin" size={24} />
                <span className="text-xs font-mono uppercase tracking-widest">Retrieving Asset Records...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gold-start/10 flex items-center justify-center">
                        <Building2 size={16} className="text-gold-start" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-stone-900 tracking-tight">Institutional Portfolio</h3>
                        <p className="text-xs text-stone-500 font-medium tracking-wide">
                            Managing <span className="text-stone-900 font-bold">{properties.length} Active Assets</span>
                        </p>
                    </div>
                </div>
                <AppButton
                    onClick={handleAddProperty}
                    disabled={!canEdit}
                    variant="primary"
                    size="sm"
                    icon={<Plus size={14} />}
                >
                    Register Asset
                </AppButton>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-stone-200 shadow-card overflow-hidden mx-2">
                <div className="overflow-x-auto" ref={tableRef}>
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-stone-50 border-b border-stone-200">
                            <tr>
                                <th className="sticky left-0 z-30 bg-stone-50 border-r border-stone-200 px-6 py-5 min-w-[60px] text-center text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                    #
                                </th>
                                {COLUMN_GROUPS.map(group => (
                                    <React.Fragment key={group.title}>
                                        {group.columns.map((col, idx) => (
                                            <th
                                                key={col.key}
                                                className={`
                                                    px-6 py-5 text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] border-r border-stone-100 whitespace-nowrap
                                                    ${idx === 0 ? 'bg-stone-50/50' : ''}
                                                `}
                                                style={{ minWidth: col.width }}
                                            >
                                                {col.label}
                                            </th>
                                        ))}
                                    </React.Fragment>
                                ))}
                                <th className="sticky right-0 z-30 bg-stone-50 border-l border-stone-200 px-6 py-5 w-[60px]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {properties.map((property, idx) => (
                                <tr key={property.id} className="hover:bg-stone-50/40 transition-all duration-300 group">
                                    <td className="sticky left-0 z-20 bg-white group-hover:bg-stone-50 border-r border-stone-100 px-6 py-5 text-center text-[10px] text-stone-400 font-mono font-bold">
                                        {(idx + 1).toString().padStart(2, '0')}
                                    </td>
                                    {COLUMN_GROUPS.map(group => (
                                        <React.Fragment key={group.title}>
                                            {group.columns.map(col => (
                                                <td
                                                    key={`${property.id}-${col.key}`}
                                                    className="px-0 py-0 border-r border-stone-50/50 relative h-[60px]"
                                                >
                                                    {col.type === 'boolean' ? (
                                                        <div className="flex justify-center items-center h-full px-6">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!(property as any)[col.key]}
                                                                onChange={(e) => handleCellUpdate(property.id, col.key, e.target.checked)}
                                                                disabled={!canEdit}
                                                                className="w-5 h-5 rounded-lg border-stone-200 text-stone-900 focus:ring-gold-start transition-all cursor-pointer"
                                                            />
                                                        </div>
                                                    ) : col.type === 'url' ? (
                                                        <div className="flex items-center gap-2 px-6 h-full">
                                                            <input
                                                                type="text"
                                                                className="bg-transparent border-none focus:ring-0 w-full text-xs font-medium text-stone-600 truncate"
                                                                defaultValue={(property as any)[col.key] || ''}
                                                                onBlur={(e) => {
                                                                    if (e.target.value !== (property as any)[col.key]) {
                                                                        handleCellUpdate(property.id, col.key, e.target.value);
                                                                    }
                                                                }}
                                                                disabled={!canEdit}
                                                                placeholder="Paste URL..."
                                                            />
                                                            {(property as any)[col.key] && (
                                                                <a
                                                                    href={(property as any)[col.key]}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-gold-start transition-colors"
                                                                >
                                                                    <ExternalLink size={12} />
                                                                </a>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <input
                                                            type={col.type === 'number' ? 'number' : 'text'}
                                                            className={`
                                                                w-full h-full px-6 bg-transparent border-none focus:ring-2 focus:ring-inset focus:ring-gold-start/10 transition-all text-xs font-semibold text-stone-800 placeholder:text-stone-300
                                                                ${savingId === property.id + col.key ? 'animate-pulse bg-gold-start/5' : ''}
                                                            `}
                                                            defaultValue={(property as any)[col.key] || ''}
                                                            onBlur={(e) => {
                                                                const newVal = col.type === 'number' ?
                                                                    (e.target.value === '' ? null : parseFloat(e.target.value)) :
                                                                    e.target.value;

                                                                const currentVal = (property as any)[col.key];
                                                                if (newVal !== currentVal) {
                                                                    handleCellUpdate(property.id, col.key, newVal);
                                                                }
                                                            }}
                                                            disabled={!canEdit}
                                                            placeholder="—"
                                                        />
                                                    )}
                                                </td>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                    <td className="sticky right-0 z-20 bg-white group-hover:bg-stone-50 border-l border-stone-100 px-6 py-5 text-center">
                                        <button
                                            onClick={() => handleDeleteProperty(property.id)}
                                            disabled={!canEdit}
                                            className="p-2 text-stone-300 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all duration-300 opacity-0 group-hover:opacity-100"
                                            title="Delete Property"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {properties.length === 0 && (
                                <tr>
                                    <td colSpan={100} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Building2 className="text-stone-200" size={40} />
                                            <h4 className="text-stone-900 font-bold tracking-tight">Portfolio Empty</h4>
                                            <p className="text-stone-500 text-xs max-w-xs mx-auto">
                                                No institutional assets recorded. Add your first property to begin establishing governance parameters.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
