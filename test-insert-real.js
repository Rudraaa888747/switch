import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://xrlobwvtxkehazwrqtgq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhybG9id3Z0eGtlaGF6d3JxdGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5ODU0MDYsImV4cCI6MjA4MzU2MTQwNn0.98tTDKn6SvufWsvkP70HS3UAYBV_yiWfXYOAcz9ILB0";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testInsert() {
  const newOrderId = 'ORD' + Date.now().toString().slice(-8);

  const orderPayload = {
    order_id: newOrderId,
    user_id: null,
    status: 'processing',
    
    subtotal: 100,
    tax: 18,
    shipping: 0,
    total: 118,
    
    items: [{ id: 1, name: 'test' }],

    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    customer_phone: '1234567890',

    shipping_address: '123 Main St',
    shipping_city: 'Delhi',
    shipping_state: 'Delhi',
    shipping_pincode: '110001',

    payment_method: 'card',
  };

  console.log('Sending insert...', orderPayload);
  const { data, error } = await supabase.from('orders').insert([orderPayload]);
  console.log('Insert Result:', data);
  if (error) {
    console.error('Insert Error Detail:', error);
  } else {
    console.log('Insert succeeded!');
  }
}

testInsert();
