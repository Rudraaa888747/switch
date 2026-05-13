import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  type AdminNotificationRecord,
} from '@/lib/adminNotifications';

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
  {
    id: 'staff-2',
    name: 'Sarah Chen',
    email: 'sarah@switch.com',
    role: 'manager',
    lastActive: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    permissions: [
      { id: 'manage_products', label: 'Manage Products', granted: true },
      { id: 'manage_orders', label: 'Manage Orders', granted: true },
      { id: 'manage_users', label: 'Manage Users', granted: true },
      { id: 'manage_staff', label: 'Manage Staff', granted: false },
      { id: 'view_reports', label: 'View Reports', granted: true },
      { id: 'manage_settings', label: 'Manage Settings', granted: false },
      { id: 'manage_marketing', label: 'Manage Marketing', granted: true },
    ],
  },
  {
    id: 'staff-3',
    name: 'Alex Rivera',
    email: 'alex@switch.com',
    role: 'editor',
    lastActive: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    permissions: [
      { id: 'manage_products', label: 'Manage Products', granted: true },
      { id: 'manage_orders', label: 'Manage Orders', granted: false },
      { id: 'manage_users', label: 'Manage Users', granted: false },
      { id: 'manage_staff', label: 'Manage Staff', granted: false },
      { id: 'view_reports', label: 'View Reports', granted: true },
      { id: 'manage_settings', label: 'Manage Settings', granted: false },
      { id: 'manage_marketing', label: 'Manage Marketing', granted: false },
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

  useEffect(() => {
    const adminSession = sessionStorage.getItem('admin_session');
    if (adminSession) {
      try {
        const session = JSON.parse(adminSession);
        if (session.authenticated && session.name) {
          setIsAdminAuthenticated(true);
          setAdminName(session.name);
          setAdminRole(session.role || 'super_admin');
          setAdminAvatar(session.avatar || null);
        }
      } catch {
        sessionStorage.removeItem('admin_session');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
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
  }, []);

  const adminLogin = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!username.trim() || !password.trim()) {
      return { success: false, error: 'Please enter both username and password' };
    }

    if (username.trim() === 'demo123' && password === 'demo123') {
      setIsAdminAuthenticated(true);
      setAdminName('Demo Admin');
      setAdminRole('super_admin');
      setAdminAvatar(null);
      sessionStorage.setItem('admin_session', JSON.stringify({
        authenticated: true,
        name: 'Demo Admin',
        role: 'super_admin',
        avatar: null,
        timestamp: Date.now(),
      }));
      return { success: true };
    }

    try {
      const { data, error } = await supabase.rpc('admin_login', {
        p_username: username.trim(),
        p_password: password,
      });

      if (error) {
        return { success: false, error: 'Database error. Please try again.' };
      }

      const result = Array.isArray(data) ? data[0] : data;

      if (result?.success) {
        setIsAdminAuthenticated(true);
        setAdminName(result.admin_name);
        setAdminRole(result.role || 'super_admin');
        setAdminAvatar(result.avatar || null);
        sessionStorage.setItem('admin_session', JSON.stringify({
          authenticated: true,
          name: result.admin_name,
          role: result.role || 'super_admin',
          avatar: result.avatar || null,
          timestamp: Date.now(),
        }));
        return { success: true };
      }

      return { success: false, error: 'Invalid username or password' };
    } catch {
      return { success: false, error: 'Connection error. Please try again.' };
    }
  };

  const adminLogout = () => {
    setIsAdminAuthenticated(false);
    setAdminName(null);
    setAdminRole('super_admin');
    setAdminAvatar(null);
    sessionStorage.removeItem('admin_session');
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

  const hasPermission = useCallback((permissionId: string): boolean => {
    const currentStaff = staffMembers.find(s => s.name === adminName);
    if (!currentStaff) return true;
    const permission = currentStaff.permissions.find(p => p.id === permissionId);
    return permission?.granted ?? true;
  }, [staffMembers, adminName]);

  return (
    <AdminContext.Provider
      value={{
        isAdminAuthenticated,
        adminName,
        adminRole,
        adminAvatar,
        adminLogin,
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
