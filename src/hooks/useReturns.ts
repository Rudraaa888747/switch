import { useQuery } from '@tanstack/react-query';
import { supabaseRestSelect } from '@/integrations/supabase/publicRest';

export interface ReturnRequest {
  id: string;
  order_id: string;
  user_id: string;
  reason: string;
  comment?: string | null;
  additional_details?: string | null;
  refund_method?: 'card' | 'upi' | 'wallet' | null;
  images?: string[] | null;
  admin_note?: string | null;
  status:
    | 'pending'
    | 'requested'
    | 'approved'
    | 'rejected'
    | 'picked_up'
    | 'item_received'
    | 'processing_refund'
    | 'refunded'
    | 'cancelled';
  refund_amount: number;
  created_at: string;
}

export const useUserReturns = (userId: string | undefined, accessToken?: string | null) => {
  return useQuery({
    queryKey: ['user-returns', userId],
    queryFn: async () => {
      if (!userId) return [];
      const params = new URLSearchParams({
        select: '*',
        user_id: `eq.${userId}`,
        order: 'created_at.desc',
      });
      const data = await supabaseRestSelect<ReturnRequest[]>('return_requests', params, accessToken);
      return data as ReturnRequest[];
    },
    enabled: !!userId,
    refetchInterval: userId ? 15_000 : false,
    refetchOnWindowFocus: true,
  });
};

export const useAdminReturns = () => {
  return useQuery({
    queryKey: ['admin-returns'],
    queryFn: async () => {
      const params = new URLSearchParams({
        select: '*,profiles(display_name),orders(order_number)',
        order: 'created_at.desc',
      });
      const data = await supabaseRestSelect('return_requests', params);
      return data;
    },
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
};
