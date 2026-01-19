import { useAuth } from '@/frontend/contexts/AuthContext';
import type { RoleType } from '@/backend/types';

/**
 * useRole Hook
 * Provides RBAC utilities based on organization membership
 */
export function useRole() {
  const { membership } = useAuth();

  const role: RoleType = (membership?.role as RoleType) ?? 'viewer';

  return {
    role,
    isOwner: role === 'owner',
    isManager: role === 'owner' || role === 'manager',
    isViewer: true, // Everyone can view

    // Specific permission checks
    canEditSettings: role === 'owner' || role === 'manager',
    canEditBilling: role === 'owner',
    canManageTeam: role === 'owner',
    canEditHotels: role === 'owner' || role === 'manager',
    canViewDashboard: true,
  };
}
