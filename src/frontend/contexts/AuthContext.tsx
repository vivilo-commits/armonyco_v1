import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/database/supabase';
import { api } from '@/backend/api';

interface User {
    id: string;
    email: string;
}

interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
    language: string | null;
    ai_tone: string | null;
}

interface Organization {
    id: string;
    name: string;
    vat_number: string | null;
    billing_street: string | null;
    billing_city: string | null;
    billing_postal: string | null;
    billing_country: string | null;
}

interface Membership {
    role: string;
    organization_id: string;
}

interface Entitlements {
    subscription_active: boolean;
    subscription_status: string | null;
    credits_balance: number;
    plan_tier: string | null;
}

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    organization: Organization | null;
    membership: Membership | null;
    entitlements: Entitlements | null;
    organizationId: string | null;
    loading: boolean;
    sessionExpired: boolean;
    isAppBlocked: boolean;
    isCreditsBlocked: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [membership, setMembership] = useState<Membership | null>(null);
    const [entitlements, setEntitlements] = useState<Entitlements | null>(null);
    const [loading, setLoading] = useState(true);
    const [sessionExpired] = useState(false);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser({ id: session.user.id, email: session.user.email! });
                fetchUserData(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser({ id: session.user.id, email: session.user.email! });
                fetchUserData(session.user.id);
            } else {
                setUser(null);
                setProfile(null);
                setOrganization(null);
                setMembership(null);
                setEntitlements(null);
                setLoading(false);
                api.setOrganizationId(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    async function fetchUserData(userId: string) {
        try {
            // Fetch profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileData) {
                setProfile(profileData);
            }

            // Fetch membership
            const { data: membershipData } = await supabase
                .from('organization_members')
                .select('*')
                .eq('user_id', userId)
                .limit(1)
                .single();

            if (membershipData) {
                setMembership(membershipData);

                // Fetch organization
                const { data: orgData } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('id', membershipData.organization_id)
                    .single();

                if (orgData) {
                    setOrganization(orgData);
                    api.setOrganizationId(orgData.id);
                }

                // Fetch entitlements
                const { data: entData } = await supabase
                    .from('organization_entitlements')
                    .select('*')
                    .eq('organization_id', membershipData.organization_id)
                    .single();

                if (entData) {
                    setEntitlements({
                        subscription_active: entData.subscription_active || false,
                        subscription_status: entData.subscription_status || null,
                        credits_balance: entData.credits_balance || 0,
                        plan_tier: entData.plan_tier || null,
                    });
                }
            }
        } catch (error) {
            console.error('[AuthContext] Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function signOut() {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setOrganization(null);
        setMembership(null);
        setEntitlements(null);
        api.setOrganizationId(null);
    }

    async function refreshProfile() {
        if (user?.id) {
            await fetchUserData(user.id);
        }
    }

    const organizationId = membership?.organization_id || null;

    // Derived blocking states
    const isAppBlocked = !!user && !!entitlements && !entitlements.subscription_active;
    const isCreditsBlocked = !!user && !!entitlements && entitlements.subscription_active && entitlements.credits_balance <= 0;

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                organization,
                membership,
                entitlements,
                organizationId,
                loading,
                sessionExpired,
                isAppBlocked,
                isCreditsBlocked,
                signOut,
                refreshProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
