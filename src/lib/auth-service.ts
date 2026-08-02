import { supabase } from './supabase-client';
import { StaffRole } from './roles';

export interface AuthUser {
  id: string;
  email: string;
  tenantId: string;
  role: StaffRole;
  branchId: string | null;
  fullName: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return {
          success: false,
          error: this.getErrorMessage(error.message),
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Authentication failed',
        };
      }

      // Fetch user profile from staff_users table
      const { data: staffData, error: staffError } = await supabase
        .from('staff_users')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .single();

      if (staffError || !staffData) {
        return {
          success: false,
          error: 'Staff profile not found',
        };
      }

      const authUser: AuthUser = {
        id: staffData.id,
        email: data.user.email!,
        tenantId: staffData.tenant_id,
        role: staffData.role as StaffRole,
        branchId: staffData.branch_id,
        fullName: staffData.full_name,
      };

      return {
        success: true,
        user: authUser,
      };
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      const { data: staffData, error: staffError } = await supabase
        .from('staff_users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (staffError || !staffData) {
        return null;
      }

      return {
        id: staffData.id,
        email: user.email!,
        tenantId: staffData.tenant_id,
        role: staffData.role as StaffRole,
        branchId: staffData.branch_id,
        fullName: staffData.full_name,
      };
    } catch (error) {
      return null;
    }
  }

  async refreshSession(): Promise<void> {
    await supabase.auth.refreshSession();
  }

  private getErrorMessage(message: string): string {
    const errorMessages: Record<string, string> = {
      'Invalid login credentials': 'Invalid email or password',
      'Email not confirmed': 'Please confirm your email address',
      'User not found': 'Account not found',
    };

    return errorMessages[message] || message;
  }
}

export const authService = new AuthService();