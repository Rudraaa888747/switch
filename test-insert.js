import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xrlobwvtxkehazwrqtgq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybG9id3Z0eGtlaGF6d3JxdGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODU0MDYsImV4cCI6MjA4MzU2MTQwNn0.98tTDKn6SvufWsvkP70HS3UAYBV_yiWfXYOAcz9ILB0";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testInsert() {
  const payload = {
    user_id: null,
    product_id: 'test-item-1',
    product_name: 'Test Product',
    quantity: 1,
    total_price: 1500,
    status: 'Order Placed',
  };
  const { data, error } = await supabase.from('orders').insert([payload]);
  console.log('Insert Result:', data);
  console.log('Insert Error:', error);
}

testInsert();
