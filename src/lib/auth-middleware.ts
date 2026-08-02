import { StaffRole, hasPermission, canAccessRoute } from './roles';
import { AuthUser } from './auth-service';

export interface AuthContext {
  userId: string | null;
  tenantId: string | null;
  role: StaffRole | null;
  branchId: string | null;
  fullName: string | null;
  email: string | null;
  isAuthenticated: boolean;
}

export function createAuthContext(user: AuthUser | null): AuthContext {
  if (user) {
    return {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      branchId: user.branchId,
      fullName: user.fullName,
      email: user.email,
      isAuthenticated: true,
    };
  }

  return {
    userId: null,
    tenantId: null,
    role: null,
    branchId: null,
    fullName: null,
    email: null,
    isAuthenticated: false,
  };
}

export function requireAuth(context: AuthContext): void {
  if (!context.isAuthenticated) {
    throw new Error('Authentication required');
  }
}

export function requirePermission(context: AuthContext, action: string, resource: string): void {
  requireAuth(context);
  
  if (!context.role) {
    throw new Error('Role not assigned');
  }
  
  if (!hasPermission(context.role, action, resource)) {
    throw new Error(`Permission denied: ${action} on ${resource}`);
  }
}

export function requireRouteAccess(context: AuthContext, route: string): void {
  requireAuth(context);
  
  if (!context.role) {
    throw new Error('Role not assigned');
  }
  
  if (!canAccessRoute(context.role, route)) {
    throw new Error(`Route access denied: ${route}`);
  }
}