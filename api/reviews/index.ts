import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdminClient } from '../_lib/supabase-admin';
import { getReviewDisplayName } from '../../src/lib/utils';

interface ReviewRow {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  sentiment: string | null;
  helpful_count: number;
  created_at: string;
  is_verified_purchase: boolean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const productId = typeof req.query.product_id === 'string' ? req.query.product_id : '';
  if (!productId) {
    return res.status(400).json({ error: 'product_id is required' });
  }

  try {
    const supabaseAdmin = getSupabaseAdminClient();

    const { data: reviews, error: reviewsError } = await supabaseAdmin
      .from('reviews')
      .select('id, user_id, product_id, rating, title, content, sentiment, helpful_count, created_at, is_verified_purchase')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (reviewsError) {
      return res.status(500).json({ error: reviewsError.message, code: reviewsError.code });
    }

    const safeReviews = (reviews || []) as ReviewRow[];

    // Aggregate over ALL reviews via RPC, not the paginated slice
    let average = 0;
    let count = 0;
    const { data: summaryRows, error: summaryError } = await supabaseAdmin.rpc(
      'get_product_review_summary',
      { p_product_id: productId }
    );
    if (!summaryError && Array.isArray(summaryRows) && summaryRows[0]) {
      const row = summaryRows[0] as { average_rating?: number | string; review_count?: number | string };
      average = Number(row.average_rating) || 0;
      count = Number(row.review_count) || 0;
    } else {
      // Fallback: exact count head query (no row data)
      const { count: exactCount } = await supabaseAdmin
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('product_id', productId);
      count = exactCount || 0;
    }

    return res.status(200).json({
      data: {
        reviews: safeReviews.map((review, index) => {
          const { user_id, ...publicReview } = review;
          return {
            ...publicReview,
            author_name: getReviewDisplayName(user_id, index),
          };
        }),
        summary: {
          average,
          count,
        },
      },
    });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to load reviews',
    });
  }
}
