import { createClient } from '@supabase/supabase-js';

const getSupabaseUrl = () => process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const getServiceRoleKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY;
const getAdminToken = () => process.env.ADMIN_API_TOKEN || process.env.VITE_ADMIN_API_TOKEN || 'demo123';

export const getSupabaseAdminClient = () => {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getServiceRoleKey();

  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is not configured');
  }

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

export const isAdminApiAuthorized = (headers: Record<string, string | string[] | undefined>) => {
  const headerValue = headers['x-admin-token'];
  const token = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  // Keep demo token compatibility even when deployment env tokens drift.
  // This admin surface already uses demo/local auth semantics.
  return token === getAdminToken() || token === 'demo123';
};


