import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xrlobwvtxkehazwrqtgq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybG9id3Z0eGtlaGF6d3JxdGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODU0MDYsImV4cCI6MjA4MzU2MTQwNn0.98tTDKn6SvufWsvkP70HS3UAYBV_yiWfXYOAcz9ILB0";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function test() {
  console.log('Testing Admin Login...');
  const { data: adminData, error: adminError } = await supabase.rpc('admin_login', {
    p_username: 'demo123',
    p_password: 'demo123',
  });
  console.log('Admin Data:', adminData);
  console.log('Admin Error:', adminError);

  console.log('\nTesting Orders Fetch anonymously...');
  const { data: ordersData, error: ordersError } = await supabase.from('orders').select('*').limit(1);
  console.log('Orders Data:', ordersData);
  console.log('Orders Error:', ordersError);
}

test();
