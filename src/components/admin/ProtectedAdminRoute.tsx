import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { PageSkeleton } from '@/components/ui/PageSkeleton';

const GUARD_TIMEOUT_MS = 8000;

/**
 * Route-level guard for all /admin/* pages.
 * Redirects to /admin/login if the user is not a real admin.
 * This is the single enforcement point — individual pages do NOT need
 * to duplicate this check.
 *
 * Strict: verified admin session required even in demo mode
 * (correct email+password only — wrong password shows error, no entry).
 * Timeout guard prevents infinite <PageSkeleton /> when Supabase is slow/blocked.
 */
const ProtectedAdminRoute = () => {
  const { user, isAuthReady } = useAuth();
  const { isAdminAuthenticated, isLoading: isAdminLoading } = useAdmin();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setTimedOut(true), GUARD_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, []);

  const stillResolving = !isAuthReady || isAdminLoading;

  if (stillResolving && !timedOut) return <PageSkeleton />;

  // Timed out but still no auth state — fail to login instead of hanging.
  if (stillResolving && timedOut && !user && !isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!user || !isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedAdminRoute;
