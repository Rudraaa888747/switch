import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdminClient, isAdminApiAuthorized } from '../../_lib/supabase-admin';

interface ReturnRequestRow {
  id?: string;
  user_id?: string;
  order_id?: string;
  [key: string]: unknown;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAdminApiAuthorized(req.headers)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabaseAdmin = getSupabaseAdminClient();

    if (req.method === 'GET') {
      const { data: returnRequests, error: returnError } = await supabaseAdmin
        .from('return_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (returnError) {
        return res.status(500).json({ error: returnError.message, code: returnError.code });
      }

      const requests = (returnRequests || []) as ReturnRequestRow[];
      const userIds = [...new Set(requests.map((row) => row.user_id).filter(Boolean))];
      const orderIds = [...new Set(requests.map((row) => row.order_id).filter(Boolean))];
      const requestIds = [...new Set(requests.map((row) => row.id).filter(Boolean))];

      let profiles: Record<string, unknown>[] = [];
      if (userIds.length > 0) {
        const { data: profileRows, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', userIds);

        if (profileError) {
          return res.status(500).json({ error: profileError.message, code: profileError.code });
        }

        profiles = (profileRows || []) as Record<string, unknown>[];
      }

      let orders: Record<string, unknown>[] = [];
      if (orderIds.length > 0) {
        const { data: orderRows, error: orderError } = await supabaseAdmin
          .from('orders')
          .select('*')
          .in('id', orderIds);

        if (orderError) {
          return res.status(500).json({ error: orderError.message, code: orderError.code });
        }

        orders = (orderRows || []) as Record<string, unknown>[];
      }

      let items: Record<string, unknown>[] = [];
      if (requestIds.length > 0) {
        const { data: itemRows, error: itemError } = await supabaseAdmin
          .from('return_request_items')
          .select('*')
          .in('return_request_id', requestIds);

        if (itemError) {
          return res.status(500).json({ error: itemError.message, code: itemError.code });
        }

        items = (itemRows || []) as Record<string, unknown>[];
      }

      return res.status(200).json({
        data: {
          returnRequests: requests,
          profiles,
          orders,
          items,
        },
      });
    }

    if (req.method === 'POST') {
      const { id, status, refund_amount, estimated_refund_date } = req.body || {};

      if (!id || !status) {
        return res.status(400).json({ error: 'id and status are required' });
      }

      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (refund_amount !== undefined) updateData.refund_amount = refund_amount;
      if (estimated_refund_date !== undefined) updateData.estimated_refund_date = estimated_refund_date;

      const { data, error } = await supabaseAdmin
        .from('return_requests')
        .update(updateData)
        .eq('id', id)
        .select('*');

      if (error) {
        return res.status(500).json({ error: error.message, code: error.code });
      }

      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Return request not found or not updated' });
      }

      return res.status(200).json({ data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: unknown) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Admin returns request failed',
    });
  }
}

