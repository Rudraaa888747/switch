import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { countDistinctOrders, getOrderRevenue, groupOrders, normalizeOrders, OrderGroup } from '@/lib/orders';
import { products } from '@/data/products';

interface AdminOverviewData {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalReviews: number;
  lowStockCount: number;
  recentOrders: OrderGroup[];
}

const OVERVIEW_ORDER_COLUMNS = 'id, order_id, customer_name, status, total, subtotal, created_at';

export const fetchAdminOverview = async (): Promise<AdminOverviewData> => {
  const [{ data: orders, error: ordersError }, { count: reviewsCount, error: reviewsError }] = await Promise.all([
    supabase.from('orders').select(OVERVIEW_ORDER_COLUMNS).order('created_at', { ascending: false }),
    supabase.from('reviews').select('id', { count: 'exact', head: true }),
  ]);

  if (ordersError) {
    throw ordersError;
  }

  if (reviewsError) {
    throw reviewsError;
  }

  const rawOrders = (orders || []) as Record<string, any>[];
  
  // For modern orders, fetch items from order_items table
  const modernOrderIds = rawOrders
    .filter(o => !o.items || (Array.isArray(o.items) && o.items.length === 0))
    .map(o => o.id);

  let allItems: any[] = [];
  if (modernOrderIds.length > 0) {
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', modernOrderIds);
    allItems = items || [];
  }

  const mergedOrders = rawOrders.map(order => {
    if (modernOrderIds.includes(order.id)) {
      const orderItems = allItems.filter(item => item.order_id === order.id);
      return { ...order, items: orderItems };
    }
    return order;
  });

  const normalizedOrders = normalizeOrders(mergedOrders);
  const groupedOrders = groupOrders(normalizedOrders);

  return {
    totalProducts: products.length,
    totalOrders: countDistinctOrders(groupedOrders),
    totalRevenue: (orders || []).reduce((sum, order) => sum + getOrderRevenue(order), 0),
    totalReviews: reviewsCount || 0,
    lowStockCount: 3,
    recentOrders: groupedOrders.slice(0, 5),
  };
};

export const useAdminOverview = () => {
  return useQuery({
    queryKey: ['admin-overview'],
    queryFn: fetchAdminOverview,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    retry: 1,
  });
};
