import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const reviewers = [
  { user_id: '11111111-1111-1111-1111-111111111111', rating: 5, sentiment: 'positive', title: 'Excellent fit', content: 'Great quality and perfect fit. Looks premium.' },
  { user_id: '22222222-2222-2222-2222-222222222222', rating: 4, sentiment: 'positive', title: 'Worth buying', content: 'Comfortable fabric and nice finish.' },
  { user_id: '33333333-3333-3333-3333-333333333333', rating: 3, sentiment: 'neutral', title: 'Decent product', content: 'Overall good, could improve stitching details.' },
];

try {
  const { data: products, error: productsError } = await supabase.from('products').select('id,name');
  if (productsError) throw productsError;

  const rows = [];
  for (const product of products || []) {
    for (const reviewer of reviewers) {
      rows.push({
        user_id: reviewer.user_id,
        product_id: product.id,
        rating: reviewer.rating,
        title: reviewer.title,
        content: reviewer.content,
        review_text: reviewer.content,
        sentiment: reviewer.sentiment,
        is_verified_purchase: true,
        helpful_count: Math.floor(Math.random() * 15),
      });
    }
  }

  if (rows.length === 0) {
    console.log('No products found. Nothing to seed.');
    process.exit(0);
  }

  const { error: upsertError } = await supabase
    .from('reviews')
    .upsert(rows, { onConflict: 'user_id,product_id' });

  if (upsertError) throw upsertError;

  console.log(`Seeded/updated ${rows.length} review rows (${reviewers.length} per product).`);
} catch (error) {
  console.error('Failed to seed fake reviews:', error);
  process.exit(1);
}
