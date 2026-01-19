import {
    LayoutDashboard,
    TrendingUp,
    AlertCircle,
    MessageSquare,
    Server,
    Settings,
} from 'lucide-react';
import { Plan } from '@/backend/types';

// NAVIGATION
export const NAV_ITEMS = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'GROWTH', label: 'Growth', icon: <TrendingUp size={20} /> },
    { id: 'ESCALATIONS', label: 'Escalations', icon: <AlertCircle size={20} /> },
    { id: 'MESSAGE_LOG', label: 'Message Log', icon: <MessageSquare size={20} /> },
    { id: 'CONTROLS', label: 'Controls', icon: <Server size={20} /> },
    { id: 'SETTINGS', label: 'Settings', icon: <Settings size={20} /> },
];

export const N8N_WEBHOOKS = {
    DEPLOY_AGENT: 'https://n8n.armonyco.ai/webhook/deploy-agent',
    UPDATE_AGENT: 'https://n8n.armonyco.ai/webhook/update-agent',
    TOGGLE_AGENT: 'https://n8n.armonyco.ai/webhook/toggle-agent',
    BUY_CREDITS: 'https://n8n.armonyco.ai/webhook/buy-credits',
    SYNC_CRM: 'https://n8n.armonyco.ai/webhook/sync-crm',
    SAVE_SETTINGS: 'https://n8n.armonyco.ai/webhook/save-settings',
};

export const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'it', label: 'Italiano' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'pt', label: 'Português' },
    { code: 'ru', label: 'Русский' },
    { code: 'zh', label: '中文' },
    { code: 'ja', label: '日本語' },
];

// PLANS
export const PLANS_DATA: Plan[] = [
    {
        id: 'pro',
        name: 'Pro',
        tag: 'ESSENTIAL',
        units: 'Up to 50 units',
        price: '€249',
        period: 'per month',
        includedCredits: 25000,
        features: [
            '25,000 Armo Credits included',
            'Full Governance Suite',
            'PMS & WhatsApp Integration',
            'Standard AI Models',
            'Dashboard & Growth KPIs'
        ],
        cta: 'Select Pro',
        stripePriceId: 'price_1SrGcDEwc5UbVBFjDnejgprL'
    },
    {
        id: 'scale',
        name: 'Scale',
        tag: 'POPULAR',
        units: 'Up to 200 units',
        price: '€499',
        period: 'per month',
        includedCredits: 100000,
        features: [
            '100,000 Armo Credits included',
            'Multi-property Management',
            'Priority Escalation Handling',
            'Advanced AI Guardrails',
            'Historical Growth Analytics'
        ],
        cta: 'Activate Scale',
        popular: true,
        stripePriceId: 'price_1SrGcEEwc5UbVBFjMKzJV4pz'
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        tag: 'SCALE',
        units: 'Up to 500 units',
        price: '€999',
        period: 'per month',
        includedCredits: 250000,
        features: [
            '250,000 Armo Credits included',
            'Dedicated Workflow Logic',
            'Custom AI Tone of Voice',
            'Infinite PMS Syncing',
            'White-glove Support'
        ],
        cta: 'Go Enterprise',
        stripePriceId: 'price_1SrGcEEwc5UbVBFjSqhLsjhS'
    },
    {
        id: 'vip',
        name: 'VIP',
        tag: 'UNLIMITED',
        units: '500+ units',
        price: 'Custom',
        period: 'bespoke enterprise',
        includedCredits: 0,
        features: [
            'Unlimited Capacity',
            'Custom Infrastructure',
            'Dedicated Account Manager',
            'On-site Training',
            'SLA-backed Uptime'
        ],
        cta: 'Contact Us',
    },
];

export const AI_MODELS = [
    {
        id: 'ai21/jamba-large-1.7',
        name: 'AI21 Jamba Large',
        cost: 5.0,
        outputVolume: 'Standard',
        price: 0.005,
    },
    {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        cost: 8.0,
        outputVolume: 'High',
        price: 0.008,
    },
    {
        id: 'google/gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        cost: 6.0,
        outputVolume: 'High',
        price: 0.006,
    },
    {
        id: 'meta-llama/llama-3.1-405b',
        name: 'Llama 3.1 405B',
        cost: 30.0,
        outputVolume: 'Very High',
        price: 0.03,
    },
    { id: 'openai/gpt-4o', name: 'GPT-4o', cost: 15.0, outputVolume: 'Very High', price: 0.015 },
    { id: 'openai/o1', name: 'OpenAI o1', cost: 20.0, outputVolume: 'Premium', price: 0.02 },
];
