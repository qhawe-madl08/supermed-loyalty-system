'use client';

import { useAuth } from '@/contexts/auth-context';
import { getRoleDisplayName } from '@/lib/roles';
import { LogoutButton } from './logout-button';

export function UserMenu() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
        <p className="text-xs text-gray-500">{getRoleDisplayName(user.role)}</p>
      </div>
      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
        {user.fullName.charAt(0).toUpperCase()}
      </div>
      <LogoutButton />
    </div>
  );
}