import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdminClient, isAdminApiAuthorized } from '../../_lib/supabase-admin';

interface ReturnRequestRow {
  id?: string;
  user_id?: string;
  order_id?: string;
  status?: string;
  refund_amount?: number;
  [key: string]: unknown;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!(await isAdminApiAuthorized(req.headers))) {
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
      const {
        id,
        status,
        refund_amount,
        estimated_refund_date,
        admin_note,
        process_wallet_refund,
        wallet_user_id,
        wallet_reference_id,
        wallet_description,
      } = req.body || {};

      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }

      const { data: existingReturn, error: existingReturnError } = await supabaseAdmin
        .from('return_requests')
        .select('id, user_id, status, refund_amount')
        .eq('id', id)
        .maybeSingle<ReturnRequestRow>();

      if (existingReturnError) {
        return res.status(500).json({ error: existingReturnError.message, code: existingReturnError.code });
      }

      if (!existingReturn) {
        return res.status(404).json({ error: 'Return request not found' });
      }

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (status !== undefined) updateData.status = status;
      if (refund_amount !== undefined) updateData.refund_amount = refund_amount;
      if (estimated_refund_date !== undefined) updateData.estimated_refund_date = estimated_refund_date;
      if (admin_note !== undefined) updateData.admin_note = admin_note;

      if (process_wallet_refund) {
        if (!wallet_user_id || refund_amount === undefined) {
          return res.status(400).json({ error: 'wallet_user_id and refund_amount are required for wallet refunds' });
        }

        const walletReferenceId = wallet_reference_id ?? String(id);
        const { data: existingWalletCredit, error: existingWalletCreditError } = await supabaseAdmin
          .from('wallet_transactions')
          .select('id')
          .eq('reference_id', walletReferenceId)
          .eq('type', 'credit')
          .eq('source', 'refund')
          .limit(1);

        if (existingWalletCreditError) {
          return res.status(500).json({ error: existingWalletCreditError.message, code: existingWalletCreditError.code });
        }

        if (!existingWalletCredit || existingWalletCredit.length === 0) {
          const { error: walletError } = await supabaseAdmin.rpc('add_wallet_credit', {
            p_user_id: wallet_user_id,
            p_amount: refund_amount,
            p_source: 'refund',
            p_reference_id: walletReferenceId,
            p_description: wallet_description ?? `Refund for return request #${String(id).slice(0, 8)}`,
          });

          if (walletError) {
            return res.status(500).json({ error: walletError.message, code: walletError.code });
          }
        }
      }

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

