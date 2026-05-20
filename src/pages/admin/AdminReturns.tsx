import React, { useMemo, useState, useCallback } from 'react';
import { format, differenceInDays } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, ChevronDown, Clock, CreditCard, Eye, Loader2, Package, Search, Undo2, User, X, XCircle } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { ProductImageViewer } from '@/components/admin/ProductImageViewer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatPrice, products } from '@/data/products';
import { supabase } from '@/integrations/supabase/client';
import { normalizeOrders } from '@/lib/orders';
import { getReturnReasonBadgeClass, getReturnReasonLabel, RETURN_REASON_OPTIONS } from '@/lib/returnReasons';
import { getProductImage, normalizeImageUrl, cn } from '@/lib/utils';
import { getAdminApiHeaders } from '@/lib/adminApi';
import { createAdminNotification } from '@/lib/adminNotifications';
import { toast } from 'sonner';

const DEFAULT_PRODUCT_IMAGE = '/placeholder.svg';

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  requested: ['approved', 'rejected'],
  approved: ['picked_up', 'rejected'],
  picked_up: ['refunded', 'rejected'],
  refunded: [],
  rejected: [],
  cancelled: [],
};

const STATUS_FLOW = [
  { key: 'requested', label: 'Requested', icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500' },
  { key: 'approved', label: 'Approved', icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-500' },
  { key: 'picked_up', label: 'Picked Up', icon: Package, color: 'text-orange-500', bg: 'bg-orange-500' },
  { key: 'refunded', label: 'Refunded', icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-500' },
];

type AdminReturnRow = Record<string, unknown> & {
  id?: string;
  user_id?: string;
  order_id?: string;
  status?: string;
  reason?: string | null;
  comment?: string | null;
  additional_details?: string | null;
  images?: string[] | null;
  admin_note?: string | null;
  created_at?: string;
  estimated_refund_date?: string;
  quantity?: number;
  order_item_id?: string;
  refund_method?: string | null;
  payment_mode?: string | null;
  items?: AdminReturnRow[];
  profiles?: { display_name?: string } | null;
  orders?: { order_id?: string } | null;
  _order_total?: number;
  order_items?: { product_name?: string; product_image?: string; unit_price?: number };
};

type UpdateReturnPayload = {
  id: string;
  status?: string;
  refund_amount?: number;
  estimated_refund_date?: string;
  admin_note?: string | null;
  process_wallet_refund?: boolean;
  wallet_user_id?: string;
  wallet_reference_id?: string;
  wallet_description?: string;
};

const parseApiResponse = async (response: Response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as { data?: unknown; error?: string };
  } catch {
    return { error: text };
  }
};

const parseImageUrls = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((v) => String(v)).filter(Boolean) : [];
  } catch {
    return [];
  }
};

const getStatusBadge = (status?: string) => {
  const value = (status || '').toLowerCase();
  if (value === 'requested') return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border border-yellow-500/30 whitespace-nowrap">Requested</Badge>;
  if (value === 'approved') return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30 whitespace-nowrap">Approved</Badge>;
  if (value === 'picked_up') return <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/30 whitespace-nowrap">Picked Up</Badge>;
  if (value === 'refunded') return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 whitespace-nowrap">Refunded</Badge>;
  if (value === 'rejected') return <Badge variant="destructive" className="whitespace-nowrap">Rejected</Badge>;
  return <Badge variant="secondary" className="whitespace-nowrap">{status || 'Unknown'}</Badge>;
};

const isValidTransition = (current: string, next: string): boolean => {
  const allowed = ALLOWED_TRANSITIONS[current.toLowerCase()];
  return !!allowed && allowed.includes(next.toLowerCase());
};

const formatDate = (dateValue?: string | null) => {
  if (!dateValue) return 'N/A';
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return 'N/A';
  return format(date, 'dd MMM yyyy');
};

const loadReturns = async () => {
  try {
    const { data: returnRequests, error: returnError } = await supabase
      .from('return_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (returnError) throw new Error(returnError.message);

    const requests = (returnRequests || []) as AdminReturnRow[];
    const requestIds = [...new Set(requests.map((row) => row.id).filter(Boolean))] as string[];
    const orderIds = [...new Set(requests.map((row) => row.order_id).filter(Boolean))] as string[];
    const userIds = [...new Set(requests.map((row) => row.user_id).filter(Boolean))] as string[];

    const [itemsRes, ordersRes, profilesRes] = await Promise.all([
      requestIds.length
        ? supabase.from('return_request_items').select('*').in('return_request_id', requestIds)
        : Promise.resolve({ data: [], error: null }),
      orderIds.length
        ? supabase.from('orders').select('*').in('id', orderIds)
        : Promise.resolve({ data: [], error: null }),
      userIds.length
        ? supabase.from('profiles').select('user_id, display_name').in('user_id', userIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    return {
      returnRequests: requests,
      orders: (ordersRes.data || []) as AdminReturnRow[],
      profiles: (profilesRes.data || []) as AdminReturnRow[],
      items: (itemsRes.data || []) as AdminReturnRow[],
    };
  } catch {
    const response = await fetch('/api/admin/returns', {
      method: 'GET',
      headers: await getAdminApiHeaders(),
    });
    const result = await parseApiResponse(response);
    if (!response.ok) throw new Error(result.error || `Failed to load returns (HTTP ${response.status})`);
    return result.data || {};
  }
};

const ReturnTimeline = ({ status }: { status: string }) => {
  const currentStatus = status.toLowerCase();
  const currentIdx = STATUS_FLOW.findIndex(s => s.key === currentStatus);
  const isRejected = currentStatus === 'rejected';

  if (isRejected) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
          <XCircle className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">Return Rejected</p>
          <p className="text-xs text-muted-foreground mt-0.5">This return request has been declined.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {STATUS_FLOW.map((step, index) => {
        const isActive = index === currentIdx;
        const isCompleted = index < currentIdx;
        const isPending = index > currentIdx;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500",
                isCompleted ? "bg-emerald-500" : isActive ? "bg-primary" : "bg-muted border border-border"
              )}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  <Icon className={cn("w-4 h-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                )}
              </div>
              {index < STATUS_FLOW.length - 1 && (
                <div className={cn(
                  "w-0.5 h-8 transition-colors duration-500",
                  isCompleted ? "bg-emerald-500" : "bg-border"
                )} />
              )}
            </div>
            <div className="pt-1">
              <p className={cn(
                "text-sm font-semibold",
                isActive ? "text-foreground" : isCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
              )}>
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isCompleted ? 'Completed' : isActive ? 'Current' : 'Pending'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AdminReturns = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [selectedReturn, setSelectedReturn] = useState<AdminReturnRow | null>(null);
  const [adminNoteDraft, setAdminNoteDraft] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    const channel = supabase
      .channel('admin-returns-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'return_requests' }, () => queryClient.invalidateQueries({ queryKey: ['admin-returns'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'return_request_items' }, () => queryClient.invalidateQueries({ queryKey: ['admin-returns'] }))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [queryClient]);

  const { data: returns = [], isLoading } = useQuery({
    queryKey: ['admin-returns'],
    queryFn: async () => {
      const payload = await loadReturns();
      const requests = payload.returnRequests || [];
      const profilesMap = new Map((payload.profiles || []).map((row) => [String(row.user_id), row]));
      const ordersMap = new Map((payload.orders || []).map((row) => [String(row.id), row]));
      const itemsMap = new Map<string, AdminReturnRow[]>();
      (payload.items || []).forEach((item) => {
        const key = String(item.return_request_id || '');
        if (!key) return;
        itemsMap.set(key, [...(itemsMap.get(key) || []), item]);
      });

      return requests.map((ret) => {
        const order = ordersMap.get(String(ret.order_id));
        const profile = profilesMap.get(String(ret.user_id));
        const normalizedOrderItems = order ? normalizeOrders([order]) : [];
        const returnItems = (itemsMap.get(String(ret.id)) || []).map((ri) => {
          const match = normalizedOrderItems.find((oi) => oi.id === ri.order_item_id || oi.product_id === ri.order_item_id);
          const product = products.find((p) => p.id === (match?.product_id || ri.order_item_id));
          const image = product ? getProductImage(product) : (match?.product_image ? normalizeImageUrl(match.product_image) || match.product_image : DEFAULT_PRODUCT_IMAGE);
          return {
            ...ri,
            order_items: {
              product_name: product?.name || match?.product_name || 'Order Item',
              product_image: image || DEFAULT_PRODUCT_IMAGE,
              unit_price:
                match && Number(match.quantity || 0) > 0
                  ? Number(match.total_price || 0) / Number(match.quantity || 1)
                  : Number(match?.total_price || 0),
            },
          };
        });

        return {
          ...ret,
          reason: ret.reason || 'other',
          comment: (ret.comment as string) || (ret.additional_details as string) || null,
          images: parseImageUrls(ret.images),
          payment_mode: order?.payment_mode || order?.payment_method || 'cod',
          profiles: { display_name: String(profile?.display_name || 'Anonymous') },
          orders: { order_id: String(order?.order_id || order?.order_number || order?.id || ret.id || '') },
          items: returnItems,
          _order_total: Number(order?.total || order?.grand_total || order?.grand_total_amount || 0),
        } as AdminReturnRow;
      });
    },
  });

  const updateReturnMutation = useMutation({
    mutationFn: async (payload: UpdateReturnPayload) => {
      let walletCredited = false;

      if (payload.process_wallet_refund && payload.wallet_user_id && payload.refund_amount !== undefined && payload.refund_amount > 0) {
        const walletRef = payload.wallet_reference_id ?? payload.id;
        const { data: existingCredit } = await supabase
          .from('wallet_transactions')
          .select('id')
          .eq('reference_id', walletRef)
          .eq('type', 'credit')
          .eq('source', 'refund')
          .limit(1);

        if (!existingCredit || existingCredit.length === 0) {
          const { error: rpcError } = await supabase.rpc('add_wallet_credit', {
            p_user_id: payload.wallet_user_id,
            p_amount: payload.refund_amount,
            p_source: 'refund',
            p_reference_id: walletRef,
            p_description: payload.wallet_description ?? `Refund for return #${String(payload.id).slice(0, 8)}`,
          });

          if (rpcError) {
            if (/permission denied/i.test(rpcError.message)) {
              toast.warning('Wallet credit failed — run the grant migration to fix');
            } else if (!/duplicate|already exists/i.test(rpcError.message)) {
              const response = await fetch('/api/admin/returns', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...(await getAdminApiHeaders()),
                },
                body: JSON.stringify(payload),
              });

              const result = await parseApiResponse(response);
              if (!response.ok) {
                throw new Error(result.error || `Failed to process refund (HTTP ${response.status})`);
              }
              walletCredited = true;
            }
          } else {
            walletCredited = true;
          }
        } else {
          walletCredited = true;
        }
      }

      const body: Record<string, unknown> = {};
      if (payload.status !== undefined) body.status = payload.status;
      if (payload.refund_amount !== undefined) body.refund_amount = payload.refund_amount;
      if (payload.estimated_refund_date !== undefined) body.estimated_refund_date = payload.estimated_refund_date;
      if (payload.admin_note !== undefined) body.admin_note = payload.admin_note;

      const { error: updateError } = await supabase
        .from('return_requests')
        .update(body)
        .eq('id', payload.id)
        .select('*');

      if (updateError) {
        const response = await fetch('/api/admin/returns', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(await getAdminApiHeaders()),
          },
          body: JSON.stringify(payload),
        });

        const result = await parseApiResponse(response);
        if (!response.ok) {
          throw new Error(result.error || `Failed to update return (HTTP ${response.status})`);
        }
      }

      if (payload.status) {
        createAdminNotification({
          title: 'Return request updated',
          message: `Return ${String(payload.id).slice(0, 8)} moved to ${payload.status.replaceAll('_', ' ')}.`,
          type: payload.status === 'rejected' ? 'warning' : 'info',
          eventType: 'return_request',
          link: '/admin/returns',
          metadata: { returnId: payload.id, status: payload.status },
        }).catch(() => {});
      }

      return { walletCredited };
    },
    onSuccess: (result, payload) => {
      queryClient.invalidateQueries({ queryKey: ['admin-returns'] });

      setSelectedReturn((prev) => {
        if (prev && String(prev.id) === payload.id) {
          const updated = { ...prev };
          if (payload.status) updated.status = payload.status;
          if (payload.admin_note !== undefined) updated.admin_note = payload.admin_note;
          return updated;
        }
      });

      if (payload.status === 'refunded') {
        if (result?.walletCredited) {
          toast.success(`Refund processed — ₹${Number(payload.refund_amount || 0).toLocaleString('en-IN')} credited to wallet`);
        } else {
          toast.success(`Return marked as refunded`);
        }
      } else {
        toast.success(`Return status updated to ${(payload.status || '').replace('_', ' ')}`);
      }
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : (error as Record<string, unknown>)?.message || 'Failed to update return';
      toast.error(String(errorMessage));
    },
  });

  const filteredReturns = useMemo(() => {
    return returns.filter((ret) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        !search ||
        String(ret.orders?.order_id || '').toLowerCase().includes(search) ||
        String(ret.profiles?.display_name || '').toLowerCase().includes(search) ||
        String(ret.comment || '').toLowerCase().includes(search);
      const matchesStatus = statusFilter === 'all' || String(ret.status) === statusFilter;
      const matchesReason = reasonFilter === 'all' || String(ret.reason) === reasonFilter;
      return matchesSearch && matchesStatus && matchesReason;
    });
  }, [returns, reasonFilter, searchTerm, statusFilter]);

  const computeRefundTotal = useCallback((ret: AdminReturnRow) => {
    const itemTotal = (ret.items || []).reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.order_items?.unit_price || 0), 0);
    return itemTotal > 0 ? itemTotal : Number(ret._order_total || 0);
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const processRefund = useCallback(async (ret: AdminReturnRow) => {
    const refundAmount = computeRefundTotal(ret);
    const prevStatus = String(ret.status || '').toLowerCase();

    if (prevStatus === 'refunded') {
      toast.error('This return has already been refunded');
      return;
    }

    if (prevStatus !== 'picked_up') {
      toast.error('Items must be picked up before processing refund');
      return;
    }

    await updateReturnMutation.mutateAsync({
      id: String(ret.id),
      status: 'refunded',
      refund_amount: refundAmount,
      process_wallet_refund: true,
      wallet_user_id: ret.user_id,
      wallet_reference_id: String(ret.id),
      wallet_description: `Refund for return #${String(ret.id).slice(0, 8)}`,
    });
  }, [computeRefundTotal, updateReturnMutation]);

  const updateStatus = useCallback((ret: AdminReturnRow, nextStatus: string) => {
    const currentStatus = String(ret.status || '').toLowerCase();

    if (!isValidTransition(currentStatus, nextStatus)) {
      toast.error(`Cannot move from "${currentStatus.replace('_', ' ')}" to "${nextStatus.replace('_', ' ')}"`);
      return;
    }

    if (nextStatus === 'refunded') {
      processRefund(ret);
      return;
    }

    const payload: UpdateReturnPayload = { id: String(ret.id), status: nextStatus };
    if (nextStatus === 'approved') {
      payload.refund_amount = Math.round(computeRefundTotal(ret));
    }
    updateReturnMutation.mutate(payload);
  }, [computeRefundTotal, processRefund, updateReturnMutation]);

  const getNextAction = (ret: AdminReturnRow) => {
    const s = String(ret.status || '').toLowerCase();
    if (s === 'requested') return { label: 'Approve', nextStatus: 'approved', variant: 'default' as const, icon: CheckCircle };
    if (s === 'approved') return { label: 'Mark Picked Up', nextStatus: 'picked_up', variant: 'default' as const, icon: Package };
    if (s === 'picked_up') return { label: 'Process Refund', nextStatus: 'refunded', variant: 'default' as const, icon: CreditCard };
    return null;
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: returns.length };
    returns.forEach(r => {
      const s = String(r.status || 'unknown');
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [returns]);

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Returns</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and process customer return requests.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <Card className="border-border/60 shadow-lg bg-card/80 backdrop-blur-sm">
            <div className="p-4 md:p-6 border-b border-border/40 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 bg-muted/40 border-border/40"
                  placeholder="Search order, customer, or comment..."
                />
              </div>
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {['all', 'requested', 'approved', 'picked_up', 'refunded', 'rejected'].map((status) => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter(status)}
                      className="rounded-full px-3 md:px-4 text-[10px] md:text-xs uppercase font-bold whitespace-nowrap"
                    >
                      {status === 'all' ? `All (${statusCounts.all || 0})` : `${status.replace('_', ' ')} (${statusCounts[status] || 0})`}
                    </Button>
                  ))}
                </div>
                <Select value={reasonFilter} onValueChange={setReasonFilter}>
                  <SelectTrigger className="w-full lg:w-64 h-11">
                    <SelectValue placeholder="Filter by reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reasons</SelectItem>
                    {RETURN_REASON_OPTIONS.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>{reason.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-4 md:p-6">
              {isLoading ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary opacity-40" />
                    <p className="text-sm text-muted-foreground">Loading returns...</p>
                  </div>
                </div>
              ) : filteredReturns.length === 0 ? (
                <div className="text-center py-16 md:py-24 space-y-4">
                  <Undo2 className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                  <p className="text-sm text-muted-foreground">No return requests found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReturns.map((ret) => {
                    const isExpanded = expandedCards.has(String(ret.id));
                    const nextAction = getNextAction(ret);
                    const daysAgo = ret.created_at ? Math.abs(differenceInDays(new Date(ret.created_at), new Date())) : 0;

                    return (
                      <motion.div
                        key={String(ret.id)}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-border/50 bg-card hover:bg-card/80 transition-all shadow-sm overflow-hidden"
                      >
                        <div className="p-4 md:p-5">
                          <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                                <p className="font-mono text-xs md:text-sm font-bold text-foreground">
                                  #{String(ret.orders?.order_id || ret.id || '').slice(0, 16)}
                                </p>
                                {getStatusBadge(String(ret.status || ''))}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {String(ret.profiles?.display_name || 'Anonymous')}
                                </span>
                                <span>{formatDate(ret.created_at)}</span>
                                {daysAgo > 0 && <span>({daysAgo}d ago)</span>}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-xs"
                                onClick={() => { toggleExpand(String(ret.id)); }}
                              >
                                {isExpanded ? <ChevronDown className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}
                                {isExpanded ? 'Less' : 'Details'}
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-xs"
                                onClick={() => { setSelectedReturn(ret); setAdminNoteDraft(String(ret.admin_note || '')); }}
                              >
                                <Eye className="mr-1 h-3 w-3" />
                                Full View
                              </Button>

                              {String(ret.status || '').toLowerCase() === 'requested' && (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-8 px-3 text-xs bg-emerald-500 hover:bg-emerald-600"
                                    onClick={() => updateStatus(ret, 'approved')}
                                    disabled={updateReturnMutation.isPending}
                                  >
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 px-3 text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                    onClick={() => updateStatus(ret, 'rejected')}
                                    disabled={updateReturnMutation.isPending}
                                  >
                                    <XCircle className="mr-1 h-3 w-3" />
                                    Reject
                                  </Button>
                                </>
                              )}

                              {String(ret.status || '').toLowerCase() === 'approved' && (
                                <Button
                                  size="sm"
                                  className="h-8 px-3 text-xs bg-orange-500 hover:bg-orange-600"
                                  onClick={() => updateStatus(ret, 'picked_up')}
                                  disabled={updateReturnMutation.isPending}
                                >
                                  <Package className="mr-1 h-3 w-3" />
                                  Picked Up
                                </Button>
                              )}

                              {String(ret.status || '').toLowerCase() === 'picked_up' && (
                                <Button
                                  size="sm"
                                  className="h-8 px-3 text-xs bg-emerald-500 hover:bg-emerald-600"
                                  onClick={() => processRefund(ret)}
                                  disabled={updateReturnMutation.isPending}
                                >
                                  <CreditCard className="mr-1 h-3 w-3" />
                                  Refund
                                </Button>
                              )}

                              {(String(ret.status || '').toLowerCase() === 'refunded' || String(ret.status || '').toLowerCase() === 'rejected') && (
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase bg-muted/50 px-3 py-1.5 rounded-full border border-border/40">
                                  <Clock size={12} />
                                  {String(ret.status || '').toLowerCase() === 'refunded' ? 'Refunded' : 'Rejected'}
                                </div>
                              )}
                            </div>
                          </div>

                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-4 pt-4 border-t border-border/30"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Items</p>
                                  <div className="space-y-2">
                                    {(ret.items || []).slice(0, 3).map((item) => (
                                      <div key={String(item.id)} className="flex items-center gap-2">
                                        <ProductImageViewer
                                          src={String(item.order_items?.product_image || DEFAULT_PRODUCT_IMAGE)}
                                          alt={String(item.order_items?.product_name || 'Product')}
                                          className="w-8 h-10 rounded flex-shrink-0"
                                        />
                                        <p className="text-xs truncate">{String(item.order_items?.product_name || 'Item')}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Reason</p>
                                  <Badge className={getReturnReasonBadgeClass(String(ret.reason || 'other')) + " text-[10px]"}>{getReturnReasonLabel(String(ret.reason || 'other'))}</Badge>
                                  {ret.comment && <p className="text-xs text-muted-foreground mt-1 truncate">{String(ret.comment)}</p>}
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Amount</p>
                                  <p className="text-lg font-bold text-primary">{formatPrice(computeRefundTotal(ret))}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Payment</p>
                                  <Badge variant="outline" className="text-[10px] uppercase">{ret.payment_mode || 'COD'}</Badge>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        <Dialog open={!!selectedReturn} onOpenChange={(open) => (!open ? setSelectedReturn(null) : null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
            {selectedReturn && (
              <>
                <div className="sticky top-0 z-10 bg-card border-b border-border/40 px-6 py-4 flex items-center justify-between">
                  <DialogHeader className="p-0">
                    <DialogTitle className="text-lg font-bold uppercase tracking-wider">
                      Return #{String(selectedReturn.orders?.order_id || selectedReturn.id || '').slice(0, 16)}
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground">
                      Submitted {formatDate(selectedReturn.created_at)}
                    </p>
                  </DialogHeader>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedReturn(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Status + Timeline */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-3">Return Progress</p>
                      <ReturnTimeline status={String(selectedReturn.status || '')} />
                    </div>
                    <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                      <Card className="border-border/40">
                        <CardContent className="p-4">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Customer</p>
                          <p className="font-semibold text-sm">{String(selectedReturn.profiles?.display_name || 'Anonymous')}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/40">
                        <CardContent className="p-4">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Payment</p>
                          <Badge variant="outline" className="uppercase text-[10px]">{selectedReturn.payment_mode || 'COD'}</Badge>
                        </CardContent>
                      </Card>
                      <Card className="border-border/40">
                        <CardContent className="p-4">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Refund Amount</p>
                          <p className="text-lg font-bold text-primary">{formatPrice(computeRefundTotal(selectedReturn))}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/40 col-span-2 md:col-span-3">
                        <CardContent className="p-4">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Reason</p>
                          <div className="flex items-center gap-2">
                            <Badge className={getReturnReasonBadgeClass(String(selectedReturn.reason || 'other'))}>{getReturnReasonLabel(String(selectedReturn.reason || 'other'))}</Badge>
                            <span>{getStatusBadge(String(selectedReturn.status || ''))}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  {/* Comment */}
                  {selectedReturn.comment && (
                    <>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">Customer Comment</p>
                        <div className="p-4 rounded-xl bg-muted/30 border border-border/40">
                          <p className="text-sm whitespace-pre-wrap">{String(selectedReturn.comment)}</p>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Products */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-3">
                      Items to Return ({selectedReturn.items?.length || 0})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(selectedReturn.items || []).map((item) => (
                        <div key={String(item.id)} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/30 transition-colors">
                          <ProductImageViewer
                            src={String(item.order_items?.product_image || DEFAULT_PRODUCT_IMAGE)}
                            alt={String(item.order_items?.product_name || 'Product')}
                            className="w-14 h-18 rounded-lg flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate">{String(item.order_items?.product_name || 'Order Item')}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Qty: {Number(item.quantity || 0)}</p>
                            <p className="text-sm font-bold text-primary mt-0.5">{formatPrice(Number(item.order_items?.unit_price || 0))}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Proof Images */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-3">Proof Images</p>
                    {parseImageUrls(selectedReturn.images).length > 0 ? (
                      <ScrollArea className="w-full">
                        <div className="flex gap-3 pb-2">
                          {parseImageUrls(selectedReturn.images).map((url, idx) => (
                            <ProductImageViewer
                              key={url}
                              src={url}
                              alt={`Proof ${idx + 1}`}
                              className="h-28 w-28 md:h-36 md:w-36 flex-shrink-0 rounded-xl"
                            />
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="text-sm text-muted-foreground">No images provided by customer.</p>
                    )}
                  </div>

                  <Separator />

                  {/* Admin Note */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">Internal Note</p>
                    <Textarea
                      value={adminNoteDraft}
                      onChange={(e) => setAdminNoteDraft(e.target.value)}
                      placeholder="Add a private note about this return..."
                      className="min-h-[80px] bg-muted/20 border-border/40"
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateReturnMutation.mutate({ id: String(selectedReturn.id), admin_note: adminNoteDraft.trim() || null })}
                        disabled={updateReturnMutation.isPending}
                      >
                        {updateReturnMutation.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                        Save Note
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Action Buttons */}
                  <div className="flex flex-wrap justify-end gap-3">
                    {String(selectedReturn.status || '').toLowerCase() === 'requested' && (
                      <>
                        <Button
                          className="bg-emerald-500 hover:bg-emerald-600 min-w-[120px]"
                          onClick={() => { updateStatus(selectedReturn, 'approved'); }}
                          disabled={updateReturnMutation.isPending}
                        >
                          {updateReturnMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          className="min-w-[120px]"
                          onClick={() => { updateStatus(selectedReturn, 'rejected'); }}
                          disabled={updateReturnMutation.isPending}
                        >
                          {updateReturnMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                          Reject
                        </Button>
                      </>
                    )}
                    {String(selectedReturn.status || '').toLowerCase() === 'approved' && (
                      <Button
                        className="bg-orange-500 hover:bg-orange-600 min-w-[160px]"
                        onClick={() => { updateStatus(selectedReturn, 'picked_up'); }}
                        disabled={updateReturnMutation.isPending}
                      >
                        {updateReturnMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
                        Mark Picked Up
                      </Button>
                    )}
                    {String(selectedReturn.status || '').toLowerCase() === 'picked_up' && (
                      <Button
                        className="bg-emerald-500 hover:bg-emerald-600 min-w-[160px]"
                        onClick={() => processRefund(selectedReturn)}
                        disabled={updateReturnMutation.isPending}
                      >
                        {updateReturnMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                        Process Refund
                      </Button>
                    )}
                    {(String(selectedReturn.status || '').toLowerCase() === 'refunded' || String(selectedReturn.status || '').toLowerCase() === 'rejected') && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/40 border border-border/40">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-medium text-muted-foreground">
                          {String(selectedReturn.status || '').toLowerCase() === 'refunded' ? 'Refund Completed' : 'Request Rejected'}
                        </span>
                      </div>
                    )}
                    {updateReturnMutation.isPending && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminReturns;
