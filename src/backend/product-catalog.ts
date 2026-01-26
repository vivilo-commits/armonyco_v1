export interface ProductDefinition {
    id: string;
    name: string;
    category: 'OPS' | 'REVENUE' | 'GUEST' | 'PLAYBOOK' | 'CUSTOM';
    governance: 'Strict' | 'Policy' | 'Human';
    productivity: 'High' | 'Direct' | 'Premium';
    humanTime: string;
    runtime: string;
    type: 'standard' | 'custom';
    defaultTemplate?: string;
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
        type: 'standard',
        defaultTemplate: "Hi {guest_name}, your self check-in is ready! Please complete the registration here: {link}. We look forward to hosting you!"
    },
    {
        id: 'SC-02',
        name: 'Self Check-out Automation',
        category: 'OPS',
        governance: 'Strict',
        productivity: 'High',
        humanTime: '0s',
        runtime: '1.2s',
        type: 'standard',
        defaultTemplate: "Hi {guest_name}, we hope you enjoyed your stay! A friendly reminder that check-out is by {checkout_time}. Safe travels!"
    },
    {
        id: 'TA-01',
        name: 'City Tax Automation',
        category: 'OPS',
        governance: 'Strict',
        productivity: 'High',
        humanTime: '0s',
        runtime: '0.8s',
        type: 'standard',
        defaultTemplate: "Hi {guest_name}, to finalize your registration, please pay the city tax using this secure link: {link}. Thank you!"
    },
    {
        id: 'PO-01',
        name: 'Payment Orchestration',
        category: 'REVENUE',
        governance: 'Strict',
        productivity: 'Direct',
        humanTime: '0s',
        runtime: '1.5s',
        type: 'standard',
        defaultTemplate: "Hi {guest_name}, friendly reminder to complete your payment for your upcoming stay: {link}."
    },
    {
        id: 'UP-01',
        name: 'Early Check-in Upsell',
        category: 'REVENUE',
        governance: 'Policy',
        productivity: 'Direct',
        humanTime: '5s',
        runtime: '1.1s',
        type: 'standard',
        defaultTemplate: "Arriving early, {guest_name}? We can have your room ready by {early_time} for just {price}. Let us know if you're interested!"
    },
    {
        id: 'UP-02',
        name: 'Late Check-out Upsell',
        category: 'REVENUE',
        governance: 'Policy',
        productivity: 'Direct',
        humanTime: '5s',
        runtime: '1.1s',
        type: 'standard',
        defaultTemplate: "Not ready to leave, {guest_name}? You can keep your room until {late_time} for just {price}. Enjoy a simplified departure!"
    },
    {
        id: 'OD-01',
        name: 'Orphan day (Pre-arrival)',
        category: 'REVENUE',
        governance: 'Policy',
        productivity: 'Direct',
        humanTime: '10s',
        runtime: '1.4s',
        type: 'standard',
        defaultTemplate: "Hi {guest_name}, would you like to arrive a day early? We have availability for an extra night at a special rate!"
    },
    {
        id: 'OD-02',
        name: 'Orphan day (Extra day)',
        category: 'REVENUE',
        governance: 'Policy',
        productivity: 'Direct',
        humanTime: '10s',
        runtime: '1.4s',
        type: 'standard',
        defaultTemplate: "Hi {guest_name}, would you like to extend your stay? We have availability for an extra night at a special rate!"
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
        type: 'custom',
        defaultTemplate: "Hi {guest_name}, do you need a transfer from the airport? Book it now for a stress-free arrival."
    },
    {
        id: 'CU-02',
        name: 'Breakfast',
        category: 'CUSTOM',
        governance: 'Human',
        productivity: 'Premium',
        humanTime: '15s',
        runtime: '0.5s',
        type: 'custom',
        defaultTemplate: "Hi {guest_name}, would you like to add breakfast to your stay? Start your day the right way!"
    },
    {
        id: 'CU-03',
        name: 'Love Pack',
        category: 'CUSTOM',
        governance: 'Human',
        productivity: 'Premium',
        humanTime: '30s',
        runtime: '1.2s',
        type: 'custom',
        defaultTemplate: "Hi {guest_name}, surprise your partner with our special Love Pack upon arrival. Let us know if you'd like to add it!"
    },
    {
        id: 'CU-04',
        name: 'Birthday pack',
        category: 'CUSTOM',
        governance: 'Human',
        productivity: 'Premium',
        humanTime: '30s',
        runtime: '1.2s',
        type: 'custom',
        defaultTemplate: "Celebrating a birthday, {guest_name}? Make it memorable with our Birthday Pack!"
    },
    {
        id: 'CU-05',
        name: 'Flowers pack',
        category: 'CUSTOM',
        governance: 'Human',
        productivity: 'Premium',
        humanTime: '20s',
        runtime: '1.1s',
        type: 'custom',
        defaultTemplate: "Hi {guest_name}, would you like fresh flowers in your room upon arrival?"
    }
];

export const ALL_PRODUCTS = [...STANDARD_PRODUCTS, ...CUSTOM_PRODUCTS];
