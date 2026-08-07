/**
 * Returns the appropriate home route based on staff role
 * 
 * Rules:
 * - Cashier → /scan (scanner is their primary workflow)
 * - Manager/Admin/Owner → /dashboard (management view)
 * 
 * @param role - The staff role from JWT claims
 * @returns The appropriate home route
 */
export function getHomeRoute(role: 'owner' | 'admin' | 'manager' | 'cashier' | null | undefined): string {
  if (role === 'cashier') {
    return '/scan';
  }
  return '/dashboard';
}
