export interface ProductDefinition {
    id: string;
    name: string;
    category: 'OPS' | 'REVENUE' | 'GUEST' | 'PLAYBOOK' | 'CUSTOM';
    governance: 'Strict' | 'Policy' | 'Human';
    productivity: 'High' | 'Direct' | 'Premium';
    humanTime: string;
    runtime: string;
    type: 'standard' | 'custom';
}

export const STANDARD_PRODUCTS: ProductDefinition[] = [
    {
        id: 'SC-01',
        name: 'Self Check-in Automation',
        category: 'OPS',
        governance: 'Strict',
        productivity: 'High',
        humanTime: '0s',
        runtime: '1.2s',
        type: 'standard'
    },
    {
        id: 'SC-02',
        name: 'Self Check-out Automation',
        category: 'OPS',
        governance: 'Strict',
        productivity: 'High',
        humanTime: '0s',
        runtime: '1.2s',
        type: 'standard'
    },
    {
        id: 'TA-01',
        name: 'City Tax Automation',
        category: 'OPS',
        governance: 'Strict',
        productivity: 'High',
        humanTime: '0s',
        runtime: '0.8s',
        type: 'standard'
    },
    {
        id: 'PO-01',
        name: 'Payment Orchestration',
        category: 'REVENUE',
        governance: 'Strict',
        productivity: 'Direct',
        humanTime: '0s',
        runtime: '1.5s',
        type: 'standard'
    },
    {
        id: 'UP-01',
        name: 'Early Check-in Upsell',
        category: 'REVENUE',
        governance: 'Policy',
        productivity: 'Direct',
        humanTime: '5s',
        runtime: '1.1s',
        type: 'standard'
    },
    {
        id: 'UP-02',
        name: 'Late Check-out Upsell',
        category: 'REVENUE',
        governance: 'Policy',
        productivity: 'Direct',
        humanTime: '5s',
        runtime: '1.1s',
        type: 'standard'
    },
    {
        id: 'OD-01',
        name: 'Orphan day (Pre-arrival)',
        category: 'REVENUE',
        governance: 'Policy',
        productivity: 'Direct',
        humanTime: '10s',
        runtime: '1.4s',
        type: 'standard'
    },
    {
        id: 'OD-02',
        name: 'Orphan day (Extra day)',
        category: 'REVENUE',
        governance: 'Policy',
        productivity: 'Direct',
        humanTime: '10s',
        runtime: '1.4s',
        type: 'standard'
    },
    {
        id: 'CH-01',
        name: 'Autonomous WhatsApp chat',
        category: 'GUEST',
        governance: 'Strict',
        productivity: 'High',
        humanTime: '0s',
        runtime: '0.6s',
        type: 'standard'
    },
    {
        id: 'CH-02',
        name: 'Autonomous Booking chat',
        category: 'GUEST',
        governance: 'Strict',
        productivity: 'High',
        humanTime: '0s',
        runtime: '0.6s',
        type: 'standard'
    },
    {
        id: 'CH-03',
        name: 'Autonomous Airbnb chat',
        category: 'GUEST',
        governance: 'Strict',
        productivity: 'High',
        humanTime: '0s',
        runtime: '0.6s',
        type: 'standard'
    }
];

export const CUSTOM_PRODUCTS: ProductDefinition[] = [
    {
        id: 'CU-01',
        name: 'Transfer',
        category: 'CUSTOM',
        governance: 'Human',
        productivity: 'Premium',
        humanTime: '15s',
        runtime: '2.1s',
        type: 'custom'
    },
    {
        id: 'CU-02',
        name: 'Breakfast',
        category: 'CUSTOM',
        governance: 'Human',
        productivity: 'Premium',
        humanTime: '15s',
        runtime: '0.5s',
        type: 'custom'
    },
    {
        id: 'CU-03',
        name: 'Love Pack',
        category: 'CUSTOM',
        governance: 'Human',
        productivity: 'Premium',
        humanTime: '30s',
        runtime: '1.2s',
        type: 'custom'
    },
    {
        id: 'CU-04',
        name: 'Birthday pack',
        category: 'CUSTOM',
        governance: 'Human',
        productivity: 'Premium',
        humanTime: '30s',
        runtime: '1.2s',
        type: 'custom'
    },
    {
        id: 'CU-05',
        name: 'Flowers pack',
        category: 'CUSTOM',
        governance: 'Human',
        productivity: 'Premium',
        humanTime: '20s',
        runtime: '1.1s',
        type: 'custom'
    }
];

export const ALL_PRODUCTS = [...STANDARD_PRODUCTS, ...CUSTOM_PRODUCTS];
