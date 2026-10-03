import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isDemoMode } from '@/hooks/useDemoMode';
import {
  fetchAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  type AdminNotificationRecord,
} from '@/lib/adminNotifications';

const ADMIN_VERIFY_TIMEOUT_MS = 8000;

const withAdminTimeout = async <T,>(promise: PromiseLike<T>, timeoutMs = ADMIN_VERIFY_TIMEOUT_MS): Promise<T> => {
  const timeout = new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error('Admin verify timed out')), timeoutMs);
  });
  return Promise.race([Promise.resolve(promise), timeout]);
};



export interface AdminPermission {
  id: string;
  label: string;
  granted: boolean;
}

export interface AdminStaff {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'manager' | 'editor' | 'support';
  avatar?: string;
  lastActive?: string;
  permissions: AdminPermission[];
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  timestamp: string;
  link?: string;
  eventType?: AdminNotificationRecord['event_type'];
}

interface AdminContextType {
  isAdminAuthenticated: boolean;
  adminName: string | null;
  adminRole: 'super_admin' | 'manager' | 'editor' | 'support';
  adminAvatar: string | null;
  adminLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminDemoLogin: (name?: string | null, email?: string | null) => void;
  refreshAdminAuth: () => Promise<void>;
  adminLogout: () => void;
  isLoading: boolean;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  notifications: AdminNotification[];
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  unreadCount: number;
  staffMembers: AdminStaff[];
  addStaffMember: (staff: Omit<AdminStaff, 'id'>) => void;
  removeStaffMember: (id: string) => void;
  updateStaffMember: (id: string, data: Partial<AdminStaff>) => void;
  hasPermission: (permissionId: string) => boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const generateId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const STAFF_STORAGE_KEY = 'switch_admin_staff';

const loadStaffFromStorage = (): AdminStaff[] => {
  try {
    const stored = localStorage.getItem(STAFF_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return DEFAULT_STAFF;
};

const DEFAULT_STAFF: AdminStaff[] = [
  {
    id: 'staff-1',
    name: 'Demo Admin',
    email: 'admin@switch.com',
    role: 'super_admin',
    lastActive: new Date().toISOString(),
    permissions: [
      { id: 'manage_products', label: 'Manage Products', granted: true },
      { id: 'manage_orders', label: 'Manage Orders', granted: true },
      { id: 'manage_users', label: 'Manage Users', granted: true },
      { id: 'manage_staff', label: 'Manage Staff', granted: true },
      { id: 'view_reports', label: 'View Reports', granted: true },
      { id: 'manage_settings', label: 'Manage Settings', granted: true },
      { id: 'manage_marketing', label: 'Manage Marketing', granted: true },
    ],
  },
];

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [adminRole, setAdminRole] = useState<'super_admin' | 'manager' | 'editor' | 'support'>('super_admin');
  const [adminAvatar, setAdminAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [staffMembers, setStaffMembers] = useState<AdminStaff[]>(loadStaffFromStorage);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staffMembers));
  }, [staffMembers]);

  const verifySessionUser = useCallback(async (userId: string, email?: string | null) => {
    // DEMO MODE: store user email+pass == admin access.
    // Any authenticated store user becomes demo admin (super_admin).
    // We still try admin_users table first so real roles win when present.
    if (isDemoMode) {
      try {
        const { data: adminData } = await withAdminTimeout(
          supabase.from('admin_users').select('role').eq('user_id', userId).eq('is_active', true).maybeSingle()
        ) as { data: { role?: string } | null };

        let displayName = email?.split('@')[0] || 'Admin';
        let avatar: string | null = null;
        try {
          const { data: profile } = await withAdminTimeout(
            supabase.from('profiles').select('display_name, avatar_url').eq('user_id', userId).maybeSingle()
          ) as { data: { display_name?: string | null; avatar_url?: string | null } | null };
          if (profile?.display_name) displayName = profile.display_name;
          avatar = profile?.avatar_url || null;
        } catch {
          // profile table slow/blocked — keep email fallback, don't block admin
        }

        setIsAdminAuthenticated(true);
        setAdminName(displayName);
        setAdminRole((adminData?.role as AdminStaff['role']) || 'super_admin');
        setAdminAvatar(avatar);
        return;
      } catch {
        // timeout / RLS — still allow demo admin from email fallback
        setIsAdminAuthenticated(true);
        setAdminName(email?.split('@')[0] || 'Admin');
        setAdminRole('super_admin');
        setAdminAvatar(null);
        return;
      }
    }

    // PRODUCTION: strict — must exist in admin_users
    try {
      const { data: adminData, error: adminError } = await withAdminTimeout(
        supabase.from('admin_users').select('role').eq('user_id', userId).eq('is_active', true).single()
      ) as { data: { role?: string } | null; error: unknown };

      if (adminError || !adminData) {
        setIsAdminAuthenticated(false);
        setAdminName(null);
        setAdminRole('support');
        setAdminAvatar(null);
        return;
      }

      const { data: profile } = await withAdminTimeout(
        supabase.from('profiles').select('display_name, avatar_url').eq('user_id', userId).maybeSingle()
      ) as { data: { display_name?: string | null; avatar_url?: string | null } | null };

      setIsAdminAuthenticated(true);
      setAdminName(profile?.display_name || email?.split('@')[0] || 'Admin');
      setAdminRole((adminData.role as AdminStaff['role']) || 'support');
      setAdminAvatar(profile?.avatar_url || null);
    } catch (error) {
      console.error('Error verifying admin session:', error);
      setIsAdminAuthenticated(false);
      setAdminName(null);
      setAdminAvatar(null);
    }
  }, []);

  const refreshAdminAuth = useCallback(async () => {
    // Strict: admin only with a verified Supabase session (correct email+password),
    // even in demo mode. Local-only cache never grants admin.
    try {
      const { data: { session } } = await withAdminTimeout(supabase.auth.getSession());
      if (session?.user) {
        await verifySessionUser(session.user.id, session.user.email);
      } else {
        setIsAdminAuthenticated(false);
        setAdminName(null);
      }
    } catch {
      setIsAdminAuthenticated(false);
      setAdminName(null);
    }
  }, [verifySessionUser]);

  // Initial verify + re-verify on every auth change (fixes stale false after login).
  useEffect(() => {
    let active = true;
    const boot = async () => {
      await refreshAdminAuth();
      if (active) setIsLoading(false);
    };
    void boot();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      if (session?.user) {
        await verifySessionUser(session.user.id, session.user.email);
      } else {
        setIsAdminAuthenticated(false);
        setAdminName(null);
        setAdminAvatar(null);
      }
    });

    // Demo bypass uses localStorage only — listen for cross-tab changes.
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'switch_user') void refreshAdminAuth();
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, [refreshAdminAuth, verifySessionUser]);

  // Only load notifications and subscribe to realtime AFTER admin is authenticated.
  // This prevents unnecessary DB queries and WebSocket connections for regular visitors.
  useEffect(() => {
    if (!isAdminAuthenticated) return;

    const mapNotification = (item: AdminNotificationRecord): AdminNotification => ({
      id: item.id,
      title: item.title,
      message: item.message,
      type: item.type,
      read: item.read,
      timestamp: item.created_at,
      link: item.link || undefined,
      eventType: item.event_type,
    });

    const loadNotifications = async () => {
      try {
        const rows = await fetchAdminNotifications();
        setNotifications(rows.map(mapNotification));
      } catch {
        setNotifications([]);
      }
    };

    loadNotifications();

    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_notifications' }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdminAuthenticated]);

  // Demo: any store user becomes admin instantly (same email+pass).
  const adminDemoLogin = useCallback((name?: string | null, email?: string | null) => {
    const displayName = name || email?.split('@')[0] || 'Admin';
    setIsAdminAuthenticated(true);
    setAdminName(displayName);
    setAdminRole('super_admin');
    setIsLoading(false);
    try {
      sessionStorage.setItem('admin_session', JSON.stringify({
        authenticated: true,
        name: displayName,
        role: 'super_admin',
        avatar: null,
        timestamp: Date.now(),
        demo: true,
      }));
    } catch { /* ignore */ }
  }, []);

  const adminLogin = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!username.trim() || !password.trim()) {
      return { success: false, error: 'Please enter both username and password' };
    }

    try {
      // 1. Authenticate with Supabase Auth (same store email+pass in demo)
      const { data: authData, error: authError } = await withAdminTimeout(
        supabase.auth.signInWithPassword({
          email: username.trim(),
          password: password,
        }),
        15000
      ) as { data: { user: { id: string; email?: string } | null }; error: { message?: string } | null };

      if (authError || !authData.user) {
        return { success: false, error: 'Invalid credentials or access denied' };
      }

      // Demo mode: grant admin immediately, try to upgrade role from admin_users (non-blocking)
      if (isDemoMode) {
        adminDemoLogin(undefined, authData.user.email);
        // Non-blocking role upgrade
        void verifySessionUser(authData.user.id, authData.user.email);
        return { success: true };
      }

      // 2. Production: fetch admin role from admin_users table securely
      const { data: adminData, error: adminError } = await withAdminTimeout(
        supabase
          .from('admin_users')
          .select('role')
          .eq('user_id', authData.user.id)
          .eq('is_active', true)
          .single()
      ) as { data: { role?: string } | null; error: unknown };

      if (adminError || !adminData) {
        // If not an admin, sign out immediately
        await supabase.auth.signOut();
        return { success: false, error: 'Unauthorized: Admin access required' };
      }

      const role = adminData.role || 'support';

      // Get profile name if available (non-blocking timeout)
      let name = authData.user.email?.split('@')[0] || 'Admin';
      let avatar: string | null = null;
      try {
        const { data: profile } = await withAdminTimeout(
          supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', authData.user.id)
            .maybeSingle()
        ) as { data: { display_name?: string | null; avatar_url?: string | null } | null };
        if (profile?.display_name) name = profile.display_name;
        avatar = profile?.avatar_url || null;
      } catch { /* keep fallback */ }

      setIsAdminAuthenticated(true);
      setAdminName(name);
      setAdminRole(role as 'super_admin' | 'manager' | 'editor' | 'support');
      setAdminAvatar(avatar);

      try {
        sessionStorage.setItem('admin_session', JSON.stringify({
          authenticated: true,
          name,
          role,
          avatar,
          timestamp: Date.now(),
        }));
      } catch { /* ignore */ }

      return { success: true };
    } catch {
      return { success: false, error: 'Connection error. Please try again.' };
    }
  };

  const adminLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch { /* ignore */ }
    setIsAdminAuthenticated(false);
    setAdminName(null);
    setAdminRole('support'); // Reset to lowest privilege — not 'super_admin'
    setAdminAvatar(null);
    setNotifications([]);
    try {
      sessionStorage.removeItem('admin_session');
      // Demo bypass has no supabase session — clear local demo user too
      // so admin logout fully exits (prevents instant re-login loop).
      if (isDemoMode) {
        const raw = localStorage.getItem('switch_user');
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as { id?: string };
            if (parsed?.id === 'demo-admin-id') localStorage.removeItem('switch_user');
          } catch { /* ignore */ }
        }
      }
    } catch { /* ignore */ }
  };

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    markAdminNotificationRead(id).catch(() => {});
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    markAllAdminNotificationsRead().catch(() => {});
  }, []);

  const addStaffMember = useCallback((staff: Omit<AdminStaff, 'id'>) => {
    const newStaff: AdminStaff = { ...staff, id: generateId() };
    setStaffMembers(prev => [...prev, newStaff]);
  }, []);

  const removeStaffMember = useCallback((id: string) => {
    setStaffMembers(prev => prev.filter(s => s.id !== id));
  }, []);

  const updateStaffMember = useCallback((id: string, data: Partial<AdminStaff>) => {
    setStaffMembers(prev =>
      prev.map(s => (s.id === id ? { ...s, ...data } : s))
    );
  }, []);

  const hasPermission = useCallback((_permissionId: string): boolean => {
    // super_admin always has all permissions (demo admin is super_admin)
    if (adminRole === 'super_admin') return true;
    if (isDemoMode && isAdminAuthenticated) return true;
    // For other roles, check their staff record by matching via userId in the future.
    // For now, find by name (cosmetic — real enforcement is server-side via admin_users table).
    const currentStaff = staffMembers.find(s => s.name === adminName);
    // If no matching staff record, DENY by default (fail-closed)
    if (!currentStaff) return false;
    const permission = currentStaff.permissions.find(p => p.id === permissionId);
    return permission?.granted ?? false;
  }, [staffMembers, adminName, adminRole, isAdminAuthenticated]);

  return (
    <AdminContext.Provider
      value={{
        isAdminAuthenticated,
        adminName,
        adminRole,
        adminAvatar,
        adminLogin,
        adminDemoLogin,
        refreshAdminAuth,
        adminLogout,
        isLoading,
        sidebarCollapsed,
        setSidebarCollapsed,
        notifications,
        markNotificationRead,
        clearNotifications,
        unreadCount,
        staffMembers,
        addStaffMember,
        removeStaffMember,
        updateStaffMember,
        hasPermission,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
