import { supabase } from '@/integrations/supabase/client';

export const getAdminApiHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {};

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const legacyToken = import.meta.env.VITE_ADMIN_API_TOKEN;
  if (legacyToken) {
    headers['x-admin-token'] = legacyToken;
  }

  return headers;
};
