'use client';

import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth-service';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await authService.logout();
    sessionStorage.removeItem('auth_user');
    router.push('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
    >
      Sign Out
    </button>
  );
}