import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseRestSelect } from '@/integrations/supabase/publicRest';
import { applyRealtimeOrderChange, groupOrders, normalizeOrders, ORDER_LIST_SELECT_COLUMNS, OrderGroup } from '@/lib/orders';

export const getUserOrdersQueryKey = (userId?: string | null) => ['user-orders', userId ?? 'guest'];

export const fetchUserOrders = async (userId: string): Promise<OrderGroup[]> => {
  const params = new URLSearchParams({
    select: ORDER_LIST_SELECT_COLUMNS,
    user_id: `eq.${userId}`,
    order: 'created_at.desc',
  });

  const data = await supabaseRestSelect<Record<string, unknown>[]>('orders', params);

  return groupOrders(normalizeOrders((data || []) as Record<string, unknown>[]));
};

export const useUserOrders = (userId?: string | null) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: getUserOrdersQueryKey(userId),
    queryFn: () => fetchUserOrders(userId!),
    enabled: !!userId,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchInterval: 15_000,
  });

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`orders-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: getUserOrdersQueryKey(userId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, userId]);

  return query;
};
