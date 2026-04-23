import { createClient } from '@supabase/supabase-js';

// Load env vars
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugReturns() {
  console.log('--- DEBUGGING RETURN SYSTEM DATA ---');
  
  // 1. Fetch Return Requests
  const { data: requests, error: reqError } = await supabase
    .from('return_requests')
    .select('id, order_id, user_id, status');
    
  if (reqError) {
    console.error('Error fetching requests:', reqError);
    return;
  }
  
  console.log(`\nFound ${requests?.length || 0} return requests`);
  if (!requests?.length) return;
  
  // Pick the most recent one
  const targetRequest = requests[0];
  console.log('\nTarget Return Request:', targetRequest);
  
  // 2. Fetch Return Items
  const { data: items, error: itemsError } = await supabase
    .from('return_request_items')
    .select('*')
    .eq('return_request_id', targetRequest.id);
    
  if (itemsError) {
    console.error('Error fetching items:', itemsError);
  } else {
    console.log('\nReturn Items:');
    console.dir(items, { depth: null });
  }
  
  // 3. Fetch Parent Order
  if (targetRequest.order_id) {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_id, items')
      .eq('id', targetRequest.order_id)
      .single();
      
    if (orderError) {
      console.error('Error fetching parent order:', orderError);
    } else {
      console.log('\nParent Order (Legacy Items JSONB):');
      console.dir(order, { depth: null });
    }
    
    // Check modern items table
    const { data: modernItems } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', targetRequest.order_id);
      
    if (modernItems?.length) {
      console.log(`\nFound ${modernItems.length} modern order_items:`);
      console.dir(modernItems, { depth: null });
    }
  }
}

debugReturns().catch(console.error);
