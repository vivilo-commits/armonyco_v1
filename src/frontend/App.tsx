import React, { useState, lazy, Suspense } from 'react';
import { Sidebar } from '@/frontend/components/layout/Sidebar';
import { View } from '@/backend/types';
import { LanguageProvider } from '@/frontend/contexts/LanguageContext';

// Lazy load all pages
const Dashboard = lazy<React.FC<{ searchTerm?: string }>>(() =>
  import('@/frontend/pages/dashboard').then((m) => ({ default: m.Dashboard }))
);
const Growth = lazy<React.FC<{ searchTerm?: string }>>(() =>
  import('@/frontend/pages/growth').then((m) => ({ default: m.Growth }))
);
const Escalations = lazy<React.FC<{ searchTerm?: string }>>(() =>
  import('@/frontend/pages/escalations')
);
const MessageLog = lazy<React.FC<{ searchTerm?: string }>>(() =>
  import('@/frontend/pages/message-log')
);
const Controls = lazy<React.FC<{ searchTerm?: string }>>(() =>
  import('@/frontend/pages/controls').then((m) => ({ default: m.Controls }))
);
const Settings = lazy(() => import('@/frontend/pages/settings').then((m) => ({ default: m.Settings })));

const LandingPage = lazy(() => import('@/frontend/pages/landing').then((m) => ({ default: m.LandingPage })));

// Modals
const PlansModal = lazy(() =>
  import('@/frontend/components/modals/PlansModal').then((m) => ({ default: m.Plans }))
);
const RechargeModal = lazy(() =>
  import('@/frontend/components/modals/RechargeModal').then((m) => ({ default: m.RechargeModal }))
);

import { LoginModal } from '@/frontend/components/modals/LoginModal';
import { SignUpModal } from '@/frontend/components/modals/SignUpModal';
import { ContactModal } from '@/frontend/components/modals/ContactModal';
import { WelcomeModal } from '@/frontend/components/modals/WelcomeModal';
import { LogoutModal } from '@/frontend/components/modals/LogoutModal';

import { api } from '@/backend/api';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import {
  SubscriptionGate,
  CreditsGate,
  CreditsDepletedBanner,
} from './components/SubscriptionGate';

import { Menu } from 'lucide-react';

const AppContent: React.FC = () => {
  // Navigation persistence mapping
  const hashToView = React.useMemo(() => ({
    'dashboard': View.DASHBOARD,
    'growth': View.GROWTH,
    'escalations': View.ESCALATIONS,
    'message-log': View.MESSAGE_LOG,
    'controls': View.CONTROLS,
    'settings': View.SETTINGS,
    'operational-protocols': View.OPERATIONAL_PROTOCOLS,
  } as Record<string, View>), []);

  const viewToHash = React.useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(hashToView).forEach(([hash, view]) => {
      map[view] = hash;
    });
    return map;
  }, [hashToView]);

  const getInitialView = (): View => {
    const hash = window.location.hash.replace('#', '');
    // Always prioritize hash if it exists and is valid
    if (hash && hashToView[hash]) {
      return hashToView[hash];
    }
    // If user is logged in but no hash, go to dashboard
    if (user) return View.DASHBOARD;
    // Otherwise landing page
    return View.LANDING;
  };

  const { user, loading: authLoading, signOut, organizationId, sessionExpired, entitlements, refreshProfile } = useAuth();
  const [currentView, setCurrentView] = useState<View>(getInitialView);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [escalationCount, setEscalationCount] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Show session expired notification
  React.useEffect(() => {
    if (sessionExpired) {
      window.alert(
        'Session Expired\n\nYour session has expired due to inactivity. Please log in again.'
      );
      setCurrentView(View.LANDING);
    }
  }, [sessionExpired]);

  // Handle logout with modal confirmation
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    setIsLoggingOut(true);
    setCurrentView(View.LANDING);
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Show welcome modal when user logs in (only once per session)
  React.useEffect(() => {
    if (user && currentView === View.DASHBOARD) {
      const hideWelcome = window.localStorage.getItem('hideWelcomeModal');
      const shownThisSession = window.sessionStorage.getItem('welcomeModalShown');
      if (!hideWelcome && !shownThisSession) {
        setShowWelcomeModal(true);
        window.sessionStorage.setItem('welcomeModalShown', 'true');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch escalation count (OPEN only for notification badge)
  React.useEffect(() => {
    const fetchCount = async () => {
      // Guard: Don't fetch if no org ID or if on landing page
      if (!organizationId || currentView === View.LANDING) {
        return;
      }

      try {
        const data = await api.getEscalationsData('OPEN');
        setEscalationCount(data?.length || 0);
      } catch (e) {
        console.error('Failed to fetch escalation count', e);
      }
    };

    fetchCount();

    // Listen for custom escalation-updated events
    const handleSync = () => {
      console.log('[App] 🔄 Escalation update detected, refreshing count...');
      fetchCount();
    };

    window.addEventListener('escalation-updated', handleSync);

    // Refresh every 30 seconds for real-time feel
    const interval = setInterval(fetchCount, 30000);
    return () => {
      window.removeEventListener('escalation-updated', handleSync);
      clearInterval(interval);
    };
  }, [organizationId, currentView]);

  // Modal states
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [activeModal, setActiveModal] = useState<'PLANS' | 'CONTACT' | 'RECHARGE' | null>(null);

  // Auto-close modals if user is already logged in
  React.useEffect(() => {
    if (user) {
      setShowLogin(false);
      setShowSignUp(false);
    }
  }, [user]);

  // Sync state to hash
  React.useEffect(() => {
    if (user && currentView !== View.LANDING) {
      const hash = viewToHash[currentView];
      if (hash && window.location.hash !== `#${hash}`) {
        window.history.pushState(null, '', `#${hash}`);
      }
    } else if (!user && currentView === View.LANDING) {
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, [currentView, user, viewToHash]);

  // Sync hash to state (handle back/forward browser buttons)
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const view = hashToView[hash];
      if (user && view && view !== currentView) {
        setCurrentView(view);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentView, user, hashToView]);

  // Auto-switch to dashboard or hashed view if logged in
  React.useEffect(() => {
    if (user && currentView === View.LANDING && (!showLogin && !showSignUp)) {
      const hash = window.location.hash.replace('#', '');
      const hashedView = hashToView[hash];
      setCurrentView(hashedView || View.DASHBOARD);
    }
  }, [user, currentView, showLogin, showSignUp, hashToView]);

  // Simplified loading - only show during initial auth OR logout
  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F0F0EE]">
        <div className="text-stone-400 animate-pulse uppercase tracking-[0.2em] font-bold text-[10px]">
          Loading...
        </div>
      </div>
    );
  }

  const renderModal = () => {
    if (activeModal === 'PLANS')
      return <PlansModal isOpen={true} onClose={() => setActiveModal(null)} />;
    if (activeModal === 'CONTACT')
      return <ContactModal isOpen={true} onClose={() => setActiveModal(null)} />;
    if (activeModal === 'RECHARGE')
      return (
        <RechargeModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          currentBalance={entitlements?.credits_balance || 0}
          autoTopupEnabled={entitlements?.auto_topup_enabled}
          onSuccess={refreshProfile}
        />
      );
    return null;
  };

  const renderContent = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard />;
      case View.GROWTH:
        return <Growth />;
      case View.ESCALATIONS:
        return <Escalations />;
      case View.MESSAGE_LOG:
        return <MessageLog />;
      case View.CONTROLS:
        return <Controls />;
      case View.SETTINGS:
        return <Settings />;
      case View.LANDING:
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <LandingPage onLogin={() => setShowLogin(true)} onSignUp={() => setShowSignUp(true)} />
          </Suspense>
        );
      default:
        return <Dashboard />;
    }
  };

  if (currentView === View.LANDING) {
    return (
      <LanguageProvider>
        <Suspense
          fallback={
            <div className="h-screen w-screen flex items-center justify-center bg-[#F0F0EE]" />
          }
        >
          <LandingPage onLogin={() => setShowLogin(true)} onSignUp={() => setShowSignUp(true)} />
        </Suspense>

        <LoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onLoginSuccess={() => {
            setShowLogin(false);
            setCurrentView(View.DASHBOARD);
          }}
        />
        <SignUpModal
          isOpen={showSignUp}
          onClose={() => setShowSignUp(false)}
        />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <SubscriptionGate
        onOpenPlans={() => setActiveModal('PLANS')}
        onOpenContact={() => setActiveModal('CONTACT')}
      >
        <CreditsGate
          onBuyCredits={() => setActiveModal('RECHARGE')}
          onEnableAutoTopup={() => setActiveModal('RECHARGE')}
        >
          <CreditsDepletedBanner />
          <div className="flex h-screen w-screen font-sans bg-stone-50 text-stone-900 selection:bg-gold-start selection:text-white overflow-hidden">
            <Sidebar
              currentView={currentView}
              onChangeView={setCurrentView}
              isMobileOpen={mobileMenuOpen}
              onCloseMobile={() => setMobileMenuOpen(false)}
              escalationCount={escalationCount}
              onLogout={handleLogout}
            />

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden fixed top-4 left-4 z-30 p-2 bg-white/80 backdrop-blur-md border border-stone-200 rounded-xl shadow-sm hover:bg-white text-stone-600 transition-all"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>

            <div className="flex-1 flex flex-col overflow-hidden relative">
              <div className="flex-1 overflow-y-auto w-full pt-16 md:pt-0">
                <Suspense fallback={<div className="h-full flex items-center justify-center" />}>
                  {renderContent()}
                </Suspense>
              </div>
            </div>

            <Suspense fallback={null}>{renderModal()}</Suspense>

            <LoginModal
              isOpen={showLogin}
              onClose={() => setShowLogin(false)}
              onLoginSuccess={() => {
                setShowLogin(false);
                setCurrentView(View.DASHBOARD);
              }}
            />
            <SignUpModal
              isOpen={showSignUp}
              onClose={() => setShowSignUp(false)}
            />
            <WelcomeModal isOpen={showWelcomeModal} onClose={() => setShowWelcomeModal(false)} />
            <LogoutModal
              isOpen={showLogoutModal}
              onClose={() => setShowLogoutModal(false)}
              onConfirm={confirmLogout}
              loading={isLoggingOut}
            />
          </div>
        </CreditsGate>
      </SubscriptionGate>
    </LanguageProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
