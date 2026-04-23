import { useMemo, useEffect } from 'react';
import { keepPreviousData, QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { supabaseRestRequest, supabaseRestSelect } from '@/integrations/supabase/publicRest';
import {
  applyRealtimeOrderChange,
  groupOrders,
  normalizeOrders,
  OrderGroup,
  toDatabaseOrderStatus,
  upsertOrderGroup,
} from '@/lib/orders';

const ADMIN_ORDERS_PAGE_SIZE = 20;
type RawOrderRow = Record<string, unknown> & { id: string; items?: Record<string, unknown>[] };
type RawOrderItemRow = Record<string, unknown> & { order_id: string };

export interface AdminOrdersFilters {
  page: number;
  pageSize?: number;
  search?: string;
  status?: string;
}

export interface AdminOrdersPage {
  orders: OrderGroup[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const normalizeAdminStatus = (status?: string) => {
  if (!status || status === 'all') {
    return null;
  }

  return status;
};

const buildAdminOrdersQuery = async ({
  page,
  pageSize = ADMIN_ORDERS_PAGE_SIZE,
  search = '',
  status = 'all',
}: AdminOrdersFilters): Promise<AdminOrdersPage> => {
  const normalizedSearch = search.trim();
  const normalizedStatus = normalizeAdminStatus(status);
  const offset = Math.max(page - 1, 0) * pageSize;
  const params = new URLSearchParams({
    select: '*',
    order: 'created_at.desc',
    offset: String(offset),
    limit: String(pageSize),
  });

  if (normalizedStatus) {
    params.set('status', `eq.${toDatabaseOrderStatus('legacy', normalizedStatus)}`);
  }

  if (normalizedSearch) {
    params.set('or', `(order_id.ilike.%${normalizedSearch}%,customer_name.ilike.%${normalizedSearch}%)`);
  }

  const { data: rawOrders, response } = await supabaseRestRequest<RawOrderRow[]>('orders', {
    method: 'GET',
    searchParams: params,
    headers: {
      Prefer: 'count=estimated',
      Range: `${offset}-${offset + pageSize - 1}`,
    },
  });

  const orders = (rawOrders || []) as RawOrderRow[];

  // For modern orders, we need to fetch items from the order_items table
  const modernOrderIds = orders
    .filter(o => !o.items || (Array.isArray(o.items) && o.items.length === 0))
    .map(o => o.id);

  let allItems: RawOrderItemRow[] = [];
  if (modernOrderIds.length > 0) {
    const itemsParams = new URLSearchParams({
      select: '*',
      order_id: `in.(${modernOrderIds.join(',')})`,
    });
    allItems = await supabaseRestSelect<RawOrderItemRow[]>('order_items', itemsParams);
  }

  const mergedOrders = orders.map(order => {
    if (modernOrderIds.includes(order.id)) {
      const orderItems = allItems.filter(item => item.order_id === order.id);
      return {
        ...order,
        items: orderItems,
      };
    }
    return order;
  });

  const normalizedOrders = groupOrders(normalizeOrders(mergedOrders));
  const contentRange = response.headers.get('content-range');
  const totalCount = contentRange ? Number(contentRange.split('/')[1] || normalizedOrders.length) : normalizedOrders.length;

  return {
    orders: normalizedOrders,
    totalCount: Number.isFinite(totalCount) ? totalCount : normalizedOrders.length,
    page,
    pageSize,
  };
};

export const getAdminOrdersQueryKey = ({ page, pageSize = ADMIN_ORDERS_PAGE_SIZE, search = '', status = 'all' }: AdminOrdersFilters) => [
  'admin-orders',
  page,
  pageSize,
  search.trim(),
  status,
];

const parseAdminOrdersQueryKey = (queryKey: readonly unknown[]): AdminOrdersFilters | null => {
  if (queryKey[0] !== 'admin-orders') {
    return null;
  }

  return {
    page: Number(queryKey[1] ?? 1),
    pageSize: Number(queryKey[2] ?? ADMIN_ORDERS_PAGE_SIZE),
    search: String(queryKey[3] ?? ''),
    status: String(queryKey[4] ?? 'all'),
  };
};

export const patchAdminOrderAcrossCaches = (
  queryClient: QueryClient,
  incomingOrder: OrderGroup
) => {
  queryClient.getQueriesData<AdminOrdersPage>({ queryKey: ['admin-orders'] }).forEach(([queryKey, currentPage]) => {
    if (!currentPage) return;
    const filters = parseAdminOrdersQueryKey(queryKey);
    if (!filters) return;

    queryClient.setQueryData<AdminOrdersPage>(queryKey, {
      ...currentPage,
      orders: upsertOrderGroup(currentPage.orders, incomingOrder, {
        search: filters.search,
        status: filters.status,
      }).slice(0, currentPage.pageSize),
    });
  });
};

export const useAdminOrders = (filters: AdminOrdersFilters) => {
  const pageSize = filters.pageSize ?? ADMIN_ORDERS_PAGE_SIZE;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: getAdminOrdersQueryKey({ ...filters, pageSize }),
    queryFn: () => buildAdminOrdersQuery({ ...filters, pageSize }),
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    retry: 1,
    placeholderData: keepPreviousData,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const channel = supabase
      .channel('admin-orders-all')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useMemo(() => ({
    ...query,
    pageSize,
    data: query.data ?? {
      orders: [],
      totalCount: 0,
      page: filters.page,
      pageSize,
    },
  }), [filters.page, pageSize, query]);
};
