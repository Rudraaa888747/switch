// Apply the RLS fix using the Supabase Management API
// We need the access token (from supabase login) to use this API.
// Since we don't have it, let's try using the service role key if we can find it.

// Actually, let's instead test the second project (pinbdhfnkdzwvmazbtrj) to see if 
// THAT's where the real data is being stored.

// The anon key for xrlobwvtxkehazwrqtgq:
const ANON_KEY_1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybG9id3Z0eGtlaGF6d3JxdGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODU0MDYsImV4cCI6MjA4MzU2MTQwNn0.98tTDKn6SvufWsvkP70HS3UAYBV_yiWfXYOAcz9ILB0";

// Decode the JWT
const parts = ANON_KEY_1.split('.');
const payload1 = JSON.parse(Buffer.from(parts[1], 'base64').toString());
console.log('Project 1 (xrlobwvtxkehazwrqtgq) anon key ref:', payload1.ref, 'role:', payload1.role);
console.log('');
console.log('=== SUPABASE SQL TO APPLY IN DASHBOARD ===');
console.log('URL: https://supabase.com/dashboard/project/xrlobwvtxkehazwrqtgq/sql/new');
console.log('');
console.log('SQL:');
console.log(`
-- Fix orders table RLS to allow anon (unauthenticated) reads and inserts
-- This is required for the admin dashboard (which uses localStorage auth, not Supabase auth)
-- and also for guest checkout (no logged-in user)

-- 1. Allow anon to SELECT all orders (for admin dashboard)
DROP POLICY IF EXISTS "orders_anon_select_all" ON public.orders;
CREATE POLICY "orders_anon_select_all"
ON public.orders
FOR SELECT
TO anon
USING (true);

-- 2. Allow anon to INSERT orders (for guest/unauthenticated checkout)
DROP POLICY IF EXISTS "orders_anon_insert" ON public.orders;
CREATE POLICY "orders_anon_insert"
ON public.orders
FOR INSERT
TO anon
WITH CHECK (true);

-- 3. Allow authenticated users to INSERT with any user_id (or null)
DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
CREATE POLICY "orders_insert_own"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Grant table access to both roles
GRANT SELECT, INSERT, UPDATE ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
`);
