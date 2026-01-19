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

import { LoginModal } from '@/frontend/components/modals/LoginModal';
import { SignUpModal } from '@/frontend/components/modals/SignUpModal';
import { ContactModal } from '@/frontend/components/modals/ContactModal';
import { WelcomeModal } from '@/frontend/components/modals/WelcomeModal';
import { LogoutModal } from '@/frontend/components/modals/LogoutModal';

import { api } from './backend/api';
import { AuthProvider, useAuth } from './frontend/contexts/AuthContext';
import {
  SubscriptionGate,
  CreditsGate,
  CreditsDepletedBanner,
} from './frontend/components/SubscriptionGate';

const AppContent: React.FC = () => {
  const { user, loading: authLoading, signOut, organizationId, sessionExpired } = useAuth();
  const [currentView, setCurrentView] = useState<View>(View.LANDING);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [escalationCount, setEscalationCount] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Sync organization ID with API service
  React.useEffect(() => {
    api.setOrganizationId(organizationId);
  }, [organizationId]);

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

  // Fetch escalation count
  React.useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await api.getEscalationsData();
        setEscalationCount(data?.length || 0);
      } catch (e) {
        console.error('Failed to fetch escalation count', e);
      }
    };
    fetchCount();
    // Refresh every 30 seconds for real-time feel
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Modal states
  const [showLogin, setShowLogin] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [activeModal, setActiveModal] = useState<'PLANS' | 'CONTACT' | null>(null);

  // Auto-close modals if user is already logged in
  React.useEffect(() => {
    if (user) {
      setShowLogin(false);
      setShowSignUp(false);
    }
  }, [user]);

  // Auto-switch to dashboard if logged in
  React.useEffect(() => {
    if (user && currentView === View.LANDING && (!showLogin && !showSignUp)) {
      setCurrentView(View.DASHBOARD);
    }
  }, [user, currentView, showLogin, showSignUp]);

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
          onBuyCredits={() => setActiveModal('PLANS')}
          onEnableAutoTopup={() => setActiveModal('PLANS')}
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

            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto">
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
