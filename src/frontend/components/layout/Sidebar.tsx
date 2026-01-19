import React, { useState } from 'react';
import { View } from '@/backend/types';
import { X, LogOut } from 'lucide-react';
import { NAV_ITEMS } from '@/frontend/constants';
import { useAuth } from '../../contexts/AuthContext';
import { TOKENS } from '@/frontend/components/design-system';
import { ASSETS } from '@/frontend/assets';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  escalationCount?: number;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  isMobileOpen,
  onCloseMobile,
  escalationCount = 0,
  onLogout,
}) => {
  const [collapsed, setCollapsed] = useState(true);
  const { profile, organization } = useAuth();

  // Use profile data from AuthContext
  const userInfo = {
    name: profile?.full_name || organization?.name || 'Admin User',
    email: profile?.email || 'admin@armonyco.ai',
  };

  const NavContent = () => (
    <>
      {/* Header / Logo Area */}
      <div
        className={`flex items-center h-20 px-8 border-b border-stone-100/40 ${collapsed ? 'justify-center px-0' : ''}`}
      >
        <div className="flex items-center justify-center w-full">
          {collapsed ? (
            <img
              src={ASSETS.logos.icon}
              alt="Armonyco"
              className="h-10 w-auto max-w-none object-contain ml-1.5"
            />
          ) : (
            <img src={ASSETS.logos.full} alt="Armonyco" className="h-9 w-auto object-contain" />
          )}
        </div>
        <button
          className="md:hidden ml-auto p-2 text-stone-400 hover:text-stone-900 transition-colors"
          onClick={onCloseMobile}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = currentView === item.id;
          const showBadge = item.id === 'ESCALATIONS' && escalationCount > 0;

          return (
            <button
              key={item.id}
              onClick={() => {
                onChangeView(item.id as View);
                onCloseMobile();
              }}
              aria-label={`Go to ${item.label}`}
              className={`
                flex items-center w-full px-4 py-3 transition-all duration-300 group relative
                ${isActive ? 'bg-stone-900 text-white shadow-premium' : 'hover:bg-stone-50 text-stone-500 hover:text-stone-900'}
                ${collapsed ? 'justify-center rounded-xl p-0 h-10 w-10 mx-auto mb-2' : TOKENS.radius.medium}
              `}
            >
              <div
                className={`
                transition-transform duration-300 ease-out flex items-center justify-center shrink-0 w-6
                ${isActive ? 'text-gold-start scale-110 drop-shadow-sm' : 'text-stone-400 group-hover:text-stone-900 group-hover:scale-110'}
              `}
              >
                {React.cloneElement(
                  item.icon as React.ReactElement<{ strokeWidth?: number; size?: number }>,
                  {
                    strokeWidth: isActive ? 2 : 1.5,
                    size: 20,
                  }
                )}
              </div>

              {!collapsed && (
                <span
                  className={`ml-4 text-[17px] font-serif tracking-tight transition-all duration-300 ${isActive ? 'text-white' : 'text-stone-500 group-hover:text-stone-900'}`}
                >
                  {item.label}
                </span>
              )}

              {showBadge && (
                <div
                  className={`
                  absolute flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full
                  ${collapsed ? 'top-0 right-0 w-4 h-4' : 'right-4 w-5 h-5'}
                `}
                >
                  {escalationCount}
                </div>
              )}

              {isActive && !collapsed && !showBadge && (
                <div className="absolute right-4 w-1 h-3 rounded-full gold-gradient shadow-gold-glow" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 border-t border-stone-100/40">
        <div
          onClick={() => {
            onChangeView(View.SETTINGS);
            onCloseMobile();
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onChangeView(View.SETTINGS);
              onCloseMobile();
            }
          }}
          aria-label="User settings"
          className={`flex items-center w-full hover:bg-stone-50 rounded-2xl p-3 transition-all duration-300 border border-transparent hover:border-stone-100 group cursor-pointer ${collapsed ? 'justify-center' : ''}`}
        >
          <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-[10px] font-bold text-stone-600 shrink-0 border border-stone-100 shadow-sm group-hover:shadow-premium transition-all">
            {(userInfo.name || 'User')
              .split(' ')
              .map((n: string) => n[0])
              .join('')}
          </div>
          {!collapsed && (
            <div className="ml-3 flex-1 truncate text-left min-w-0">
              <p className="text-[13px] font-bold text-stone-900 truncate tracking-tight">
                {userInfo.name}
              </p>
              <p className="text-[11px] font-medium text-stone-400 truncate uppercase tracking-widest leading-none mt-1">
                Decision OS™
              </p>
            </div>
          )}
          {!collapsed && onLogout && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLogout();
              }}
              className="p-2 text-stone-400 hover:text-red-500 transition-colors ml-auto group/logout"
              title="Logout"
            >
              <LogOut size={14} className="group-hover/logout:scale-110 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-stone-900/10 backdrop-blur-[2px] z-40 md:hidden animate-in fade-in duration-300"
          onClick={onCloseMobile}
          aria-label="Close sidebar"
        />
      )}

      <aside
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        className={`
            fixed md:sticky top-0 h-screen bg-white border-r border-stone-100/60 flex flex-col transition-all duration-500 ease-in-out z-50
            ${isMobileOpen ? 'translate-x-0 w-72 shadow-2xl' : '-translate-x-full md:translate-x-0'}
            ${collapsed ? 'md:w-20' : 'md:w-72'}
        `}
      >
        <NavContent />
      </aside>
    </>
  );
};
