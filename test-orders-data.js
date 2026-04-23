import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xrlobwvtxkehazwrqtgq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybG9id3Z0eGtlaGF6d3JxdGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODU0MDYsImV4cCI6MjA4MzU2MTQwNn0.98tTDKn6SvufWsvkP70HS3UAYBV_yiWfXYOAcz9ILB0";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkOrdersData() {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('Recent Orders:', JSON.stringify(data, null, 2));
  if (error) {
    console.error('Error fetching:', error);
  }
}

checkOrdersData();
