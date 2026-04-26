import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, ChevronLeft, ChevronRight, Clock, Eye, Filter, Package, Search, Truck, User, XCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { supabaseRestUpdate } from '@/integrations/supabase/publicRest';
import { formatPrice } from '@/data/products';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn, getProductImage, normalizeImageUrl } from '@/lib/utils';
import { products } from '@/data/products';
import { groupOrders, normalizeOrders, OrderGroup, toDatabaseOrderStatus, upsertOrderGroup } from '@/lib/orders';
import { AdminOrdersPage, useAdminOrders } from '@/hooks/useAdminOrders';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { getAdminApiHeaders } from '@/lib/adminApi';

const DEFAULT_PRODUCT_IMAGE = '/placeholder.svg';
const PAGE_SIZE = 20;
const statusOptions = ['Order Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

interface UpdateOrderResponse {
  data?: Record<string, unknown>[];
  error?: string;
}

const parseApiResponse = async (response: Response): Promise<UpdateOrderResponse> => {
  const responseText = await response.text();
  if (!responseText) return {};

  try {
    return JSON.parse(responseText) as UpdateOrderResponse;
  } catch {
    return { error: responseText };
  }
};

const buildOrderUpdatePayload = ({
  schemaVersion,
  status,
  estimatedDelivery,
}: {
  schemaVersion: string;
  status: string;
  estimatedDelivery?: string;
}) => {
  const payload: Record<string, unknown> = { status };

  if (schemaVersion === 'modern') {
    payload.estimated_delivery_at = estimatedDelivery ? `${estimatedDelivery}T00:00:00.000Z` : null;
  } else if (estimatedDelivery) {
    payload.estimated_delivery = estimatedDelivery;
  }

  return payload;
};

const updateOrderViaRestFallback = async ({
  order,
  status,
  estimatedDelivery,
}: {
  order: OrderGroup;
  status: string;
  estimatedDelivery?: string;
}) => {
  const payload = buildOrderUpdatePayload({
    schemaVersion: order.schema_version,
    status,
    estimatedDelivery,
  });

  const byIdParams = new URLSearchParams({ id: `eq.${order.source_id}` });
  const byOrderIdParams = new URLSearchParams({
    order_id: `eq.${order.order_id || order.source_id}`,
  });

  let updatedRows = await supabaseRestUpdate<Record<string, unknown>[]>(
    'orders',
    payload,
    byIdParams
  );

  if (!updatedRows || updatedRows.length === 0) {
    updatedRows = await supabaseRestUpdate<Record<string, unknown>[]>(
      'orders',
      payload,
      byOrderIdParams
    );
  }

  return updatedRows || [];
};

const formatOrderDate = (dateValue?: string | null) => {
  if (!dateValue) return 'Date unavailable';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Delivered':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'Shipped':
      return <Truck className="w-4 h-4 text-blue-500" />;
    case 'Out for Delivery':
      return <Truck className="w-4 h-4 text-orange-500" />;
    case 'Processing':
      return <Package className="w-4 h-4 text-yellow-500" />;
    case 'Order Placed':
      return <Clock className="w-4 h-4 text-gray-500" />;
    case 'Cancelled':
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Delivered':
      return 'bg-green-100 text-green-800';
    case 'Shipped':
      return 'bg-blue-100 text-blue-800';
    case 'Out for Delivery':
      return 'bg-orange-100 text-orange-800';
    case 'Processing':
      return 'bg-yellow-100 text-yellow-800';
    case 'Order Placed':
      return 'bg-gray-100 text-gray-800';
    case 'Cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getOrderImageUrl = (order: OrderGroup) => {
  const firstItem = order.items[0];
  if (firstItem?.product_image) {
    return normalizeImageUrl(firstItem.product_image) || DEFAULT_PRODUCT_IMAGE;
  }
  const product = products.find((item) => item.id === firstItem?.product_id);
  return product ? getProductImage(product) : DEFAULT_PRODUCT_IMAGE;
};

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const debouncedSearchQuery = useDebouncedValue(searchQuery.trim(), 300);

  const { data, isLoading, isFetching, error } = useAdminOrders({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearchQuery,
    status: statusFilter,
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchQuery, statusFilter]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Orders unavailable',
        description: 'Admin order data could not be loaded right now.',
        variant: 'destructive',
      });
    }
  }, [error]);

  const orders = data.orders;
  const totalPages = Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE));

  const orderStats = useMemo(() => {
    return {
      total: data.totalCount,
      pending: orders.filter((order) => order.status === 'Order Placed' || order.status === 'Processing').length,
      shipped: orders.filter((order) => order.status === 'Shipped' || order.status === 'Out for Delivery').length,
      delivered: orders.filter((order) => order.status === 'Delivered').length,
    };
  }, [data.totalCount, orders]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ order, displayStatus, estimatedDelivery }: { order: OrderGroup; displayStatus: string; estimatedDelivery?: string }) => {
      if (displayStatus === 'Cancelled') {
        const { data: cancelResult, error: rpcError } = await supabase.rpc('handle_order_cancellation', {
          p_order_id: order.order_id || order.source_id,
          p_user_id: order.user_id,
          p_cancelled_by: 'admin'
        });

        if (rpcError) throw rpcError;
        if (!cancelResult.success) throw new Error(cancelResult.error);

        return {
          ...order,
          status: 'Cancelled',
          cancelled_at: new Date().toISOString(),
        };
      }

      const databaseStatus = toDatabaseOrderStatus(order.schema_version, displayStatus);
      const adminHeaders = await getAdminApiHeaders();

      const response = await fetch('/api/admin/orders/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...adminHeaders,
        },
        body: JSON.stringify({
          orderId: order.source_id,
          status: databaseStatus,
          schemaVersion: order.schema_version,
          estimatedDeliveryAt: estimatedDelivery || null,
          estimatedDeliveryDate: estimatedDelivery || null,
        }),
      });

      const result = await parseApiResponse(response);
      let updatedRows = result.data ?? [];

      if (!response.ok || !updatedRows.length) {
        try {
          updatedRows = await updateOrderViaRestFallback({
            order,
            status: databaseStatus,
            estimatedDelivery,
          });
        } catch (fallbackError) {
          const fallbackMessage =
            fallbackError instanceof Error ? fallbackError.message : 'Fallback update failed';
          const apiMessage = result?.error || `Failed to update order (HTTP ${response.status})`;
          throw new Error(`${apiMessage}. ${fallbackMessage}`);
        }
      }

      return groupOrders(normalizeOrders(updatedRows))[0] ?? {
        ...order,
        status: displayStatus,
        estimated_delivery_date: estimatedDelivery || order.estimated_delivery_date,
      };
    },
    onMutate: async ({ order, displayStatus, estimatedDelivery }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-orders'] });
      const snapshots = queryClient.getQueriesData<AdminOrdersPage>({ queryKey: ['admin-orders'] });

      queryClient.setQueriesData<AdminOrdersPage>({ queryKey: ['admin-orders'] }, (currentPage) => {
        if (!currentPage) return currentPage;

        return {
          ...currentPage,
          orders: currentPage.orders.map((existing) =>
            existing.id === order.id
              ? {
                  ...existing,
                  status: displayStatus,
                  estimated_delivery_date: estimatedDelivery || existing.estimated_delivery_date,
                }
              : existing
          ),
        };
      });

      return { snapshots };
    },
    onError: (mutationError, _variables, context) => {
      console.error('Error updating order:', mutationError);
      context?.snapshots.forEach(([queryKey, snapshot]) => {
        queryClient.setQueryData(queryKey, snapshot);
      });
      toast({
        title: 'Failed to update order status',
        description: mutationError instanceof Error ? mutationError.message : 'Unknown error',
        variant: 'destructive',
      });
    },
    onSuccess: (updatedOrder) => {
      queryClient.setQueriesData<AdminOrdersPage>({ queryKey: ['admin-orders'] }, (currentPage) => {
        if (!currentPage) return currentPage;
        return {
          ...currentPage,
          orders: upsertOrderGroup(currentPage.orders, updatedOrder, {
            search: debouncedSearchQuery,
            status: statusFilter,
          }).slice(0, currentPage.pageSize),
        };
      });

      toast({
        title: 'Order Updated',
        description: `Order status changed to ${updatedOrder.status}`,
      });
    },
  });

  const updateOrderStatus = (order: OrderGroup, displayStatus: string, estimatedDelivery?: string) => {
    updateStatusMutation.mutate({ order, displayStatus, estimatedDelivery });
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold mb-1">Orders Management</h1>
          <p className="text-muted-foreground">Server-paginated order tracking with lean search and filtered fetches.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { label: 'Total Orders', value: orderStats.total, color: 'bg-primary/10 text-primary' },
            { label: 'Pending', value: orderStats.pending, color: 'bg-yellow-500/10 text-yellow-600' },
            { label: 'Shipped', value: orderStats.shipped, color: 'bg-blue-500/10 text-blue-600' },
            { label: 'Delivered', value: orderStats.delivered, color: 'bg-green-500/10 text-green-600' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <Package className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by order or customer..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Orders</CardTitle>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
                {isFetching && !isLoading ? ' • Updating…' : ''}
              </span>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="h-16 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  No admin orders matched this filter.
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Order Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Est. Delivery</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">{order.order_id || order.id}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {order.customer_name || 'Unknown'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img
                                src={getOrderImageUrl(order)}
                                alt={order.items[0]?.product_name || 'Order item'}
                                onError={({ currentTarget }) => {
                                  currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                                }}
                                className="w-10 h-10 object-cover rounded"
                              />
                              <div>
                                <span className="font-medium">{order.items[0]?.product_name || 'Order item'}</span>
                                {order.items.length > 1 && (
                                  <p className="text-xs text-muted-foreground">+{order.items.length - 1} more item(s)</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{order.total_quantity}</TableCell>
                          <TableCell>{formatPrice(order.grand_total)}</TableCell>
                          <TableCell>{formatOrderDate(order.order_date)}</TableCell>
                          <TableCell>
                            <Badge className={cn(getStatusColor(order.status))}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(order.status)}
                                {order.status}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell>{order.estimated_delivery_date ? formatOrderDate(order.estimated_delivery_date) : 'Not set'}</TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader className="border-b pb-4">
                                  <div className="flex items-center justify-between">
                                    <DialogTitle className="text-xl font-bold">Order Details</DialogTitle>
                                    <Badge className={cn("px-3 py-1", getStatusColor(order.status))}>
                                      <div className="flex items-center gap-1.5">
                                        {getStatusIcon(order.status)}
                                        <span className="font-semibold">{order.status}</span>
                                      </div>
                                    </Badge>
                                  </div>
                                </DialogHeader>

                                <div className="space-y-8 py-4">
                                  {/* Info Grid */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-4 rounded-xl border border-border/50">
                                    <div className="space-y-4">
                                      <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                          <Package className="w-4 h-4 text-muted-foreground" />
                                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order Information</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                          <span className="text-muted-foreground">Order ID:</span>
                                          <span className="font-mono font-medium">{order.order_id || order.id}</span>
                                          <span className="text-muted-foreground">Date:</span>
                                          <span>{formatOrderDate(order.order_date)}</span>
                                          <span className="text-muted-foreground">Payment:</span>
                                          <span className="font-medium text-primary uppercase">{order.payment_method || 'N/A'}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-4">
                                      <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                          <User className="w-4 h-4 text-muted-foreground" />
                                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer Details</span>
                                        </div>
                                        <div className="grid grid-cols-1 gap-1 text-sm">
                                          <p className="font-medium text-base">{order.customer_name || 'Unknown'}</p>
                                          <div className="flex items-center gap-2 text-muted-foreground">
                                            <div className="w-4 h-4 flex items-center justify-center">📞</div>
                                            <span>{order.customer_phone || 'N/A'}</span>
                                          </div>
                                          <div className="flex items-start gap-2 text-muted-foreground mt-1">
                                            <div className="w-4 h-4 flex items-center justify-center mt-0.5">📍</div>
                                            <span className="leading-tight">
                                              {[order.shipping_address, order.shipping_city, order.shipping_state, order.shipping_pincode].filter(Boolean).join(', ') || 'N/A'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Items Section */}
                                  <div className="space-y-4">
                                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                      Items <Badge variant="secondary" className="rounded-full px-2 py-0 h-5 text-[10px]">{order.items.length}</Badge>
                                    </h3>
                                    <div className="space-y-3">
                                      {order.items.map((item) => {
                                        const product = products.find(p => p.id === item.product_id);
                                        const imageUrl = item.product_image 
                                          ? normalizeImageUrl(item.product_image) 
                                          : (product ? getProductImage(product) : DEFAULT_PRODUCT_IMAGE);

                                        return (
                                          <div key={item.id} className="flex items-center gap-4 group p-3 rounded-xl border border-border/40 hover:border-primary/20 transition-all hover:bg-muted/30">
                                            <div className="relative w-16 h-20 flex-shrink-0 overflow-hidden rounded-lg border bg-muted">
                                              <img 
                                                src={imageUrl} 
                                                alt={item.product_name}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                onError={(e) => { e.currentTarget.src = DEFAULT_PRODUCT_IMAGE; }}
                                              />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="font-semibold text-sm truncate">{item.product_name}</p>
                                              <p className="text-xs text-muted-foreground mt-0.5">
                                                Qty: <span className="font-medium text-foreground">{item.quantity}</span>
                                              </p>
                                            </div>
                                            <div className="text-right">
                                              <p className="font-bold text-sm">{formatPrice(item.total_price)}</p>
                                              <p className="text-[10px] text-muted-foreground">{formatPrice(item.total_price / item.quantity)} each</p>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Calculation Summary */}
                                  <div className="flex justify-end pt-4 border-t">
                                    <div className="w-full max-w-[240px] space-y-2">
                                      <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Discount Applied</span>
                                        <span className="text-green-600 font-medium">-{formatPrice(order.discount_applied || 0)}</span>
                                      </div>
                                      <div className="flex justify-between items-center pt-2 border-t">
                                        <span className="text-base font-semibold">Grand Total</span>
                                        <span className="text-xl font-black text-primary">{formatPrice(order.grand_total)}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Manage Section */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                                    <div className="space-y-2">
                                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" /> Update Status
                                      </label>
                                      <Select value={order.status} onValueChange={(value) => updateOrderStatus(order, value)}>
                                        <SelectTrigger className="w-full h-10 rounded-lg">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {statusOptions.map((status) => (
                                            <SelectItem key={status} value={status}>
                                              {status}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="space-y-2">
                                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                        <Calendar className="w-3 h-3" /> Est. Delivery Date
                                      </label>
                                      <div className="relative">
                                        <input
                                          type="date"
                                          className="flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-1 text-sm shadow-sm transition-all focus-within:ring-1 focus-within:ring-primary hover:bg-muted/10 outline-none"
                                          defaultValue={order.estimated_delivery_date || ''}
                                          onBlur={(event) => {
                                            if (event.target.value !== order.estimated_delivery_date) {
                                              updateOrderStatus(order, order.status, event.target.value);
                                            }
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, data.totalCount)} of {data.totalCount}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Previous
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>
                        Next
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;
