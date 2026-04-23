import { supabase } from './src/integrations/supabase/client';

async function debugReturns() {
  console.log('--- DEBUGGING RETURN REQUESTS ---');
  
  // 1. Check return_requests table
  const { data: requests, error: reqError } = await supabase
    .from('return_requests' as any)
    .select('*');
    
  if (reqError) {
    console.error('Error fetching return_requests:', reqError);
  } else {
    console.log(`Found ${requests?.length || 0} return requests:`, requests);
  }

  // 2. Check return_request_items table
  const { data: items, error: itemError } = await supabase
    .from('return_request_items' as any)
    .select('*');
    
  if (itemError) {
    console.error('Error fetching return_request_items:', itemError);
  } else {
    console.log(`Found ${items?.length || 0} return request items:`, items);
  }

  // 3. Check for any profile mismatches
  if (requests && requests.length > 0) {
    const userIds = [...new Set(requests.map(r => r.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds);
    console.log('Matching profiles found:', profiles);
  }
}

debugReturns();
