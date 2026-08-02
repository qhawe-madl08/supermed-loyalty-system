import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { cache } from 'react';

export const createSupabaseServerClient = cache(() => {
  return createServerComponentClient({ cookies: () => cookies() });
});

export async function getSession() {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export type UserRole = 'cashier' | 'manager' | 'admin' | 'owner';

export async function getUserRole(): Promise<UserRole | null> {
  const user = await getUser();
  if (!user) return null;
  
  // Role will be stored in user metadata or a separate profiles table
  // For now, default to cashier
  return (user.user_metadata?.role as UserRole) ?? 'cashier';
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error('Authentication required');
  }
  return session;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();
  const role = await getUserRole();
  
  if (!role || !allowedRoles.includes(role)) {
    throw new Error('Insufficient permissions');
  }
  
  return { session, role };
}

export function hasPermission(userRole: UserRole | null, requiredRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  cashier: 1,
  manager: 2,
  admin: 3,
  owner: 4,
};

export function canAccess(userRole: UserRole | null, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}