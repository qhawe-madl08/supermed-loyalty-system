export enum StaffRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  HEAD_OFFICE_ADMIN = 'HEAD_OFFICE_ADMIN', 
  BRANCH_MANAGER = 'BRANCH_MANAGER',
  CASHIER = 'CASHIER',
  READ_ONLY_AUDITOR = 'READ_ONLY_AUDITOR'
}

export interface Permission {
  action: string;
  resource: string;
  description: string;
}

export const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  [StaffRole.SUPER_ADMIN]: [
    { action: '*', resource: '*', description: 'Full system access' },
    { action: 'manage', resource: 'tenants', description: 'Manage all tenants' },
    { action: 'manage', resource: 'users', description: 'Manage all users' },
    { action: 'manage', resource: 'settings', description: 'Manage system settings' },
    { action: 'view', resource: 'audit_logs', description: 'View all audit logs' },
  ],
  [StaffRole.HEAD_OFFICE_ADMIN]: [
    { action: 'view', resource: 'dashboard', description: 'View organization dashboard' },
    { action: 'manage', resource: 'customers', description: 'Manage all customers' },
    { action: 'manage', resource: 'transactions', description: 'Manage all transactions' },
    { action: 'manage', resource: 'cards', description: 'Manage loyalty cards' },
    { action: 'manage', resource: 'campaigns', description: 'Manage marketing campaigns' },
    { action: 'manage', resource: 'rewards', description: 'Manage rewards catalog' },
    { action: 'view', resource: 'branches', description: 'View all branches' },
    { action: 'manage', resource: 'staff', description: 'Manage staff users' },
    { action: 'view', resource: 'audit_logs', description: 'View audit logs' },
  ],
  [StaffRole.BRANCH_MANAGER]: [
    { action: 'view', resource: 'dashboard', description: 'View branch dashboard' },
    { action: 'manage', resource: 'customers', description: 'Manage branch customers' },
    { action: 'manage', resource: 'transactions', description: 'Manage branch transactions' },
    { action: 'manage', resource: 'cards', description: 'Manage branch cards' },
    { action: 'view', resource: 'staff', description: 'View branch staff' },
    { action: 'manage', resource: 'staff', description: 'Manage branch staff' },
  ],
  [StaffRole.CASHIER]: [
    { action: 'view', resource: 'dashboard', description: 'View branch dashboard' },
    { action: 'create', resource: 'customers', description: 'Enroll new customers' },
    { action: 'view', resource: 'customers', description: 'View customer details' },
    { action: 'create', resource: 'transactions', description: 'Record transactions' },
    { action: 'view', resource: 'transactions', description: 'View transaction history' },
    { action: 'assign', resource: 'cards', description: 'Assign cards to customers' },
  ],
  [StaffRole.READ_ONLY_AUDITOR]: [
    { action: 'view', resource: 'dashboard', description: 'View dashboard' },
    { action: 'view', resource: 'customers', description: 'View customer information' },
    { action: 'view', resource: 'transactions', description: 'View transaction records' },
    { action: 'view', resource: 'audit_logs', description: 'View audit logs' },
  ],
};

export function hasPermission(role: StaffRole, action: string, resource: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  
  // Check for wildcard permission
  const hasWildcard = permissions.some(p => p.action === '*' && p.resource === '*');
  if (hasWildcard) return true;
  
  // Check for specific permission
  return permissions.some(p => 
    (p.action === action || p.action === '*') && 
    (p.resource === resource || p.resource === '*')
  );
}

export function canAccessRoute(role: StaffRole, route: string): boolean {
  const routePermissions: Record<string, StaffRole[]> = {
    '/dashboard': [StaffRole.SUPER_ADMIN, StaffRole.HEAD_OFFICE_ADMIN, StaffRole.BRANCH_MANAGER, StaffRole.CASHIER, StaffRole.READ_ONLY_AUDITOR],
    '/workflows': [StaffRole.SUPER_ADMIN, StaffRole.HEAD_OFFICE_ADMIN, StaffRole.BRANCH_MANAGER, StaffRole.CASHIER],
    '/workflows/customers': [StaffRole.SUPER_ADMIN, StaffRole.HEAD_OFFICE_ADMIN, StaffRole.BRANCH_MANAGER, StaffRole.CASHIER, StaffRole.READ_ONLY_AUDITOR],
    '/workflows/enroll': [StaffRole.SUPER_ADMIN, StaffRole.HEAD_OFFICE_ADMIN, StaffRole.BRANCH_MANAGER, StaffRole.CASHIER],
    '/workflows/transaction': [StaffRole.SUPER_ADMIN, StaffRole.HEAD_OFFICE_ADMIN, StaffRole.BRANCH_MANAGER, StaffRole.CASHIER],
    '/workflows/customers/[id]': [StaffRole.SUPER_ADMIN, StaffRole.HEAD_OFFICE_ADMIN, StaffRole.BRANCH_MANAGER, StaffRole.CASHIER, StaffRole.READ_ONLY_AUDITOR],
    '/admin': [StaffRole.SUPER_ADMIN, StaffRole.HEAD_OFFICE_ADMIN],
    '/admin/users': [StaffRole.SUPER_ADMIN, StaffRole.HEAD_OFFICE_ADMIN],
    '/admin/settings': [StaffRole.SUPER_ADMIN],
  };
  
  const allowedRoles = routePermissions[route] || [];
  return allowedRoles.includes(role);
}

export function getRoleDisplayName(role: StaffRole): string {
  const displayNames: Record<StaffRole, string> = {
    [StaffRole.SUPER_ADMIN]: 'Super Admin',
    [StaffRole.HEAD_OFFICE_ADMIN]: 'Head Office Admin',
    [StaffRole.BRANCH_MANAGER]: 'Branch Manager',
    [StaffRole.CASHIER]: 'Cashier',
    [StaffRole.READ_ONLY_AUDITOR]: 'Auditor',
  };
  return displayNames[role];
}