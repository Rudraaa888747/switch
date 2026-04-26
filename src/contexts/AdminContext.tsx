import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminContextType {
  isAdminAuthenticated: boolean;
  adminName: string | null;
  adminLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => void;
  isLoading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminName, setAdminName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if admin session exists
    const adminSession = sessionStorage.getItem('admin_session');
    if (adminSession) {
      try {
        const session = JSON.parse(adminSession);
        if (session.authenticated && session.name) {
          setIsAdminAuthenticated(true);
          setAdminName(session.name);
        }
      } catch {
        sessionStorage.removeItem('admin_session');
      }
    }
    setIsLoading(false);
  }, []);

  const adminLogin = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Quick validation before hitting the database
    if (!username.trim() || !password.trim()) {
      return { success: false, error: 'Please enter both username and password' };
    }

    // Immediate fallback check for demo credentials
    if (username.trim() === 'demo123' && password === 'demo123') {
      setIsAdminAuthenticated(true);
      setAdminName('Demo Admin');
      sessionStorage.setItem('admin_session', JSON.stringify({
        authenticated: true,
        name: 'Demo Admin',
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

      // Handle both array and single object responses
      const result = Array.isArray(data) ? data[0] : data;
      
      if (result?.success) {
        // Update state and storage immediately
        setIsAdminAuthenticated(true);
        setAdminName(result.admin_name);
        sessionStorage.setItem('admin_session', JSON.stringify({
          authenticated: true,
          name: result.admin_name,
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
    sessionStorage.removeItem('admin_session');
  };

  return (
    <AdminContext.Provider value={{ isAdminAuthenticated, adminName, adminLogin, adminLogout, isLoading }}>
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
