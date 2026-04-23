import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required env vars: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const now = Date.now();
const email = `switch-e2e-${now}@example.com`;
const password = `Switch#${now}Aa`;
const orderId = `ORD${String(now).slice(-8)}`;
const itemPrice = 1499;
const quantity = 1;
const subtotal = itemPrice * quantity;
const tax = Math.round(subtotal * 0.18);
const shipping = 0;
const total = subtotal + tax + shipping;

let userId = null;
let orderRow = null;
let returnRequestRow = null;
let returnItems = [];
let realtimeHit = false;
let channel = null;

const restInsert = async (path, payload, authToken) => {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`REST insert failed (${path}): ${response.status} ${JSON.stringify(body)}`);
  }

  return body;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

try {
  console.log('1) Creating + signing in test user...');

  const signUpAttempt = await anon.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: 'Switch E2E User' },
    },
  });

  if (signUpAttempt.error) {
    throw signUpAttempt.error;
  }

  const createdUser = signUpAttempt.data.user;
  if (!createdUser) {
    throw new Error('Signup did not return a user');
  }

  userId = createdUser.id;

  if (!signUpAttempt.data.session) {
    await admin.auth.admin.updateUserById(userId, { email_confirm: true });
  }

  const signIn = await anon.auth.signInWithPassword({ email, password });
  if (signIn.error || !signIn.data.session) {
    throw signIn.error || new Error('Sign in failed');
  }

  const accessToken = signIn.data.session.access_token;
  userId = signIn.data.user.id;

  await admin.from('profiles').upsert(
    [{ user_id: userId, display_name: 'Switch E2E User' }],
    { onConflict: 'user_id' }
  );

  console.log(`   User ready: ${userId}`);

  console.log('2) Subscribing realtime on return_requests...');
  await new Promise((resolve, reject) => {
    channel = anon
      .channel(`e2e-returns-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'return_requests',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          realtimeHit = true;
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          resolve(true);
        }
      });

    setTimeout(() => reject(new Error('Realtime subscription timeout')), 10_000);
  });

  console.log('3) Placing order using user token...');
  const estimatedDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const orderPayload = {
    order_id: orderId,
    user_id: userId,
    status: 'processing',
    estimated_delivery: estimatedDate,
    subtotal,
    tax,
    shipping,
    total,
    items: [
      {
        product_id: 'prod-e2e-test',
        product_name: 'E2E Test Product',
        product_image: '/placeholder.svg',
        quantity,
        price: itemPrice,
        total_price: subtotal,
        size: 'M',
        color: 'Black',
      },
    ],
    customer_name: 'Switch E2E User',
    customer_email: email,
    customer_phone: '9999999999',
    shipping_address: 'E2E Street 1',
    shipping_city: 'Ahmedabad',
    shipping_state: 'Gujarat',
    shipping_pincode: '380015',
    payment_method: 'cod',
  };

  const insertedOrders = await restInsert('orders', [orderPayload], accessToken);
  orderRow = insertedOrders?.[0];
  if (!orderRow?.id) {
    throw new Error('Order insert succeeded but no row/id returned');
  }
  console.log(`   Order created: ${orderRow.order_id || orderRow.id}`);

  console.log('4) Creating return request + items...');
  const insertedRequests = await restInsert(
    'return_requests',
    [
      {
        order_id: orderRow.id,
        user_id: userId,
        reason: 'size_issue',
        additional_details: 'Automated E2E validation',
        status: 'requested',
      },
    ],
    accessToken
  );

  returnRequestRow = insertedRequests?.[0];
  if (!returnRequestRow?.id) {
    throw new Error('Return request insert succeeded but no row/id returned');
  }

  returnItems = await restInsert(
    'return_request_items',
    [
      {
        return_request_id: returnRequestRow.id,
        order_item_id: orderRow.id,
        quantity: 1,
      },
    ],
    accessToken
  );
  console.log(`   Return request created: ${returnRequestRow.id}`);

  await sleep(3500);
  if (!realtimeHit) {
    throw new Error('Realtime event not received for return_requests insert');
  }

  console.log('5) Verifying admin visibility + update path...');
  const { data: adminViewRows, error: adminViewError } = await admin
    .from('return_requests')
    .select('id,status,order_id,user_id')
    .eq('id', returnRequestRow.id)
    .limit(1);

  if (adminViewError || !adminViewRows || adminViewRows.length === 0) {
    throw new Error(`Admin visibility failed: ${adminViewError?.message || 'row missing'}`);
  }

  const { error: updateError } = await admin
    .from('return_requests')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', returnRequestRow.id);

  if (updateError) {
    throw new Error(`Admin status update failed: ${updateError.message}`);
  }

  const { data: updatedRows, error: verifyError } = await admin
    .from('return_requests')
    .select('status')
    .eq('id', returnRequestRow.id)
    .single();

  if (verifyError || updatedRows?.status !== 'approved') {
    throw new Error(
      `Updated status verification failed: ${verifyError?.message || `status=${updatedRows?.status}`}`
    );
  }

  console.log('✅ E2E PASS: user order + return + admin visibility/update + realtime are working.');
} catch (error) {
  console.error('❌ E2E FAIL:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (channel) {
    await anon.removeChannel(channel);
  }

  if (returnItems.length > 0) {
    const returnItemIds = returnItems.map((item) => item.id).filter(Boolean);
    if (returnItemIds.length > 0) {
      await admin.from('return_request_items').delete().in('id', returnItemIds);
    }
  }

  if (returnRequestRow?.id) {
    await admin.from('return_requests').delete().eq('id', returnRequestRow.id);
  }

  if (orderRow?.id) {
    await admin.from('orders').delete().eq('id', orderRow.id);
  }

  if (userId) {
    await admin.auth.admin.deleteUser(userId);
  }
}
