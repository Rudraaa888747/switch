import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xrlobwvtxkehazwrqtgq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybG9id3Z0eGtlaGF6d3JxdGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODU0MDYsImV4cCI6MjA4MzU2MTQwNn0.98tTDKn6SvufWsvkP70HS3UAYBV_yiWfXYOAcz9ILB0";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkOrders() {
  console.log('Testing Select...');
  const { data: readData, error: readError } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(2);
  console.log('Read Error:', readError);
  console.log('Read Data:', readData);

  console.log('\nTesting Insert...');
  const { data: insertData, error: insertError } = await supabase.from('orders').insert([{
    user_id: null,
    order_id: 'ORD12345678',
    status: 'processing',
    subtotal: 100,
    tax: 18,
    shipping: 0,
    total: 118,
    items: [],
    shipping_address: '123 Test St',
    shipping_city: 'Test City',
    payment_method: 'cod'
  }]).select();
  console.log('Insert Error:', insertError);
  console.log('Insert Data:', insertData);
}

checkOrders();
