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
    auto_topup_enabled?: boolean;
    auto_topup_threshold?: number;
    auto_topup_amount?: number;
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
    isLowCredits: boolean;
    canEdit: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    // Role-based permissions
    userRole: 'owner' | 'manager' | 'viewer' | null;
    canAccessSettings: boolean;
    canEditSettings: boolean;
    canAccessControls: boolean;
    canManageTeam: boolean;
    canResolveEscalations: boolean;
    canEditGeneralSettings: boolean;
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
        let mounted = true;
        let initializing = true;

        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!mounted) return;

                if (session?.user) {
                    setUser({ id: session.user.id, email: session.user.email! });
                    await fetchUserData(session.user.id, true);
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error('[AuthContext] Error in initAuth:', error);
                if (mounted) setLoading(false);
            } finally {
                initializing = false;
            }
        };

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[AuthContext] Auth session change:', event, session?.user?.id);

            if (!mounted) return;

            // Avoid double fetch on initial session if initAuth is already handling it
            if (initializing && (event === 'INITIAL_SESSION' || event === 'SIGNED_IN')) {
                return;
            }

            if (session?.user) {
                setUser({ id: session.user.id, email: session.user.email! });
                await fetchUserData(session.user.id);
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

        initAuth();

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function fetchUserData(userId: string, isInitial: boolean = false) {
        if (!userId) return;

        console.log('[AuthContext] 🔄 Fetching data for user:', userId, isInitial ? '(Initial)' : '');

        try {
            // 1. Fetch profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError) {
                console.error('[AuthContext] Profile fetch error:', profileError);
                // Return early if we can't get the profile as it's the base of everything
                // throw profileError; // Optional: throw to handle in catch
            }

            // 2. Fetch membership
            const { data: memberships, error: membershipError } = await supabase
                .from('organization_members')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1);

            if (membershipError) console.error('[AuthContext] Membership fetch error:', membershipError);

            let membershipData = null;
            let orgData = null;
            let entData = null;

            if (memberships && memberships.length > 0) {
                membershipData = memberships[0];

                // 3. Fetch organization
                const { data: fetchedOrgData, error: orgError } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('id', membershipData.organization_id)
                    .single();

                if (orgError) console.error('[AuthContext] Organization fetch error:', orgError);
                orgData = fetchedOrgData;

                if (orgData) {
                    // Update API singleton IMMEDIATELY before state updates
                    // This prevents children from fetching with null orgId
                    api.setOrganizationId(orgData.id);

                    // 4. Fetch entitlements
                    const { data: fetchedEntData, error: entError } = await supabase
                        .from('organization_entitlements')
                        .select('*')
                        .eq('organization_id', orgData.id)
                        .single();

                    if (entError) console.error('[AuthContext] Entitlements fetch error:', entError);
                    entData = fetchedEntData;
                }
            }

            // Batch all state updates
            if (profileData) setProfile(profileData);
            if (membershipData) setMembership(membershipData);
            if (orgData) setOrganization(orgData);

            if (entData) {
                setEntitlements({
                    subscription_active: entData.subscription_active || false,
                    subscription_status: entData.subscription_status || null,
                    credits_balance: entData.credits_balance || 0,
                    plan_tier: entData.plan_tier || null,
                    auto_topup_enabled: !!entData.auto_topup_enabled,
                    auto_topup_threshold: entData.auto_topup_threshold || 10000,
                    auto_topup_amount: entData.auto_topup_amount || 10000,
                });
            }

        } catch (error) {
            console.error('[AuthContext] Critical core error fetching data:', error);
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
        // Force redirect to landing page
        window.location.href = '/';
    }

    async function refreshProfile() {
        if (user?.id) {
            await fetchUserData(user.id);
        }
    }


    const organizationId = membership?.organization_id || null;

    // Role-based permissions: Owner, Manager, Viewer (Admin removed)
    const userRole = membership?.role.toLowerCase() as 'owner' | 'manager' | 'viewer' | null || null;

    // 1. Navigation Visibility
    // Owner & Manager can see everything. Viewer cannot see Settings or Controls.
    const canAccessSettings = userRole ? ['owner', 'manager'].includes(userRole) : false;
    const canAccessControls = userRole ? ['owner', 'manager'].includes(userRole) : false;

    // 2. Action Permissions
    // Owner: Can do everything.
    // Manager: Can see everything, but only EDIT Escalations.
    // Viewer: Read-only everywhere.

    // Can edit general hotel settings/billing (Owner only)
    const canEditSettings = userRole === 'owner';
    const canEditGeneralSettings = userRole === 'owner';

    // Can manage team members (Owner only)
    const canManageTeam = userRole === 'owner';

    // Can resolve/edit escalations (Owner & Manager)
    const canResolveEscalations = userRole ? ['owner', 'manager'].includes(userRole) : false;

    // Global edit flag (kept for components that use it as a general guard)
    // Managers can edit "some" things (escalations), so they have canEdit = true,
    // but specific actions are gated by more granular flags above.
    const canEdit = userRole ? ['owner', 'manager'].includes(userRole) : false;

    // Derived blocking states
    // Block if: user is logged in AND no valid subscription
    // Valid subscription = subscription_active is true OR plan_tier exists (e.g., 'VIP', 'PRO', etc.)
    const hasValidSubscription: boolean = !!entitlements && (
        entitlements.subscription_active === true ||
        !!(entitlements.plan_tier && entitlements.plan_tier.trim() !== '')
    );
    const isAppBlocked: boolean = !!user && !hasValidSubscription;
    const isCreditsBlocked: boolean = !!user && hasValidSubscription && (entitlements?.credits_balance ?? 0) <= 0;
    const isLowCredits: boolean = !!user && hasValidSubscription && (entitlements?.credits_balance ?? 0) > 0 && (entitlements?.credits_balance ?? 0) < 10000;

    // Debug logging for subscription issues
    if (user && entitlements) {
        console.log('[AuthContext] Subscription check:', {
            role: userRole,
            subscription_active: entitlements.subscription_active,
            plan_tier: entitlements.plan_tier,
            hasValidSubscription,
            isAppBlocked
        });
    }

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
                isLowCredits,
                canEdit,
                signOut,
                refreshProfile,
                userRole,
                canAccessSettings,
                canEditSettings,
                canAccessControls,
                // New granular permissions
                canManageTeam,
                canResolveEscalations,
                canEditGeneralSettings,
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
