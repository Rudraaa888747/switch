import React, { useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Box, CheckCircle, Clock, CreditCard, Eye, Loader2, Search, Undo2, XSquare } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { ProductImageViewer } from '@/components/admin/ProductImageViewer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatPrice, products } from '@/data/products';
import { supabase } from '@/integrations/supabase/client';
import { supabaseRestSelect, supabaseRestUpdate } from '@/integrations/supabase/publicRest';
import { normalizeOrders } from '@/lib/orders';
import { getReturnReasonBadgeClass, getReturnReasonLabel, RETURN_REASON_OPTIONS } from '@/lib/returnReasons';
import { getProductImage, normalizeImageUrl } from '@/lib/utils';
import { toast } from 'sonner';

const DEFAULT_PRODUCT_IMAGE = '/placeholder.svg';

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
  items?: AdminReturnRow[];
  profiles?: { display_name?: string } | null;
  orders?: { order_id?: string } | null;
  _order_total?: number;
  order_items?: { product_name?: string; product_image?: string; unit_price?: number };
};

interface AdminReturnsApiData {
  returnRequests?: AdminReturnRow[];
  profiles?: AdminReturnRow[];
  orders?: AdminReturnRow[];
  items?: AdminReturnRow[];
}

type UpdateReturnPayload = {
  id: string;
  status?: string;
  refund_amount?: number;
  estimated_refund_date?: string;
  admin_note?: string | null;
};

const parseApiResponse = async (response: Response): Promise<{ data?: AdminReturnsApiData; error?: string }> => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as { data?: AdminReturnsApiData; error?: string };
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
  if (value === 'requested') return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border border-yellow-500/30">Requested</Badge>;
  if (value === 'approved') return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30">Approved</Badge>;
  if (value === 'picked_up') return <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-300 border border-orange-500/30">Picked Up</Badge>;
  if (value === 'refunded') return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">Refunded</Badge>;
  if (value === 'rejected') return <Badge variant="destructive">Rejected</Badge>;
  return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
};

const loadReturns = async () => {
  try {
    const returnRequests = await supabaseRestSelect<AdminReturnRow[]>(
      'return_requests',
      new URLSearchParams({ select: '*', order: 'created_at.desc' })
    );

    const requestIds = [...new Set((returnRequests || []).map((row) => row.id).filter(Boolean))];
    const orderIds = [...new Set((returnRequests || []).map((row) => row.order_id).filter(Boolean))];
    const userIds = [...new Set((returnRequests || []).map((row) => row.user_id).filter(Boolean))];

    const items = requestIds.length
      ? await supabaseRestSelect<AdminReturnRow[]>(
          'return_request_items',
          new URLSearchParams({ select: '*', return_request_id: `in.(${requestIds.join(',')})` })
        )
      : [];
    const orders = orderIds.length
      ? await supabaseRestSelect<AdminReturnRow[]>(
          'orders',
          new URLSearchParams({ select: '*', id: `in.(${orderIds.join(',')})` })
        )
      : [];
    const profiles = userIds.length
      ? await supabaseRestSelect<AdminReturnRow[]>(
          'profiles',
          new URLSearchParams({ select: 'user_id,display_name', user_id: `in.(${userIds.join(',')})` })
        )
      : [];

    return { returnRequests: returnRequests || [], orders: orders || [], profiles: profiles || [], items: items || [] } as AdminReturnsApiData;
  } catch {
    const response = await fetch('/api/admin/returns', {
      method: 'GET',
      headers: { 'x-admin-token': import.meta.env.VITE_ADMIN_API_TOKEN || 'demo123' },
    });
    const result = await parseApiResponse(response);
    if (!response.ok) throw new Error(result.error || `Failed to load returns (HTTP ${response.status})`);
    return result.data || {};
  }
};

const AdminReturns = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [selectedReturn, setSelectedReturn] = useState<AdminReturnRow | null>(null);
  const [adminNoteDraft, setAdminNoteDraft] = useState('');

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
              unit_price: match?.total_price || 0,
            },
          };
        });

        return {
          ...ret,
          reason: ret.reason || 'other',
          comment: (ret.comment as string) || (ret.additional_details as string) || null,
          images: parseImageUrls(ret.images),
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
      const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (payload.status !== undefined) body.status = payload.status;
      if (payload.refund_amount !== undefined) body.refund_amount = payload.refund_amount;
      if (payload.estimated_refund_date !== undefined) body.estimated_refund_date = payload.estimated_refund_date;
      if (payload.admin_note !== undefined) body.admin_note = payload.admin_note;
      await supabaseRestUpdate('return_requests', body, new URLSearchParams({ id: `eq.${payload.id}` }));
    },
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({ queryKey: ['admin-returns'] });
      toast.success(payload.status ? `Return status updated to ${payload.status.replace('_', ' ')}` : 'Admin note saved');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update return');
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

  const computeRefundTotal = (ret: AdminReturnRow) => {
    const itemTotal = (ret.items || []).reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.order_items?.unit_price || 0), 0);
    return itemTotal > 0 ? itemTotal : Number(ret._order_total || 0);
  };

  const updateStatus = (ret: AdminReturnRow, status: string) => {
    const payload: UpdateReturnPayload = { id: String(ret.id), status };
    if (status === 'approved') payload.estimated_refund_date = addDays(new Date(), 7).toISOString();
    if (status === 'refunded') payload.refund_amount = computeRefundTotal(ret);
    updateReturnMutation.mutate(payload);
  };

  return (
    <AdminLayout>
      <TooltipProvider>
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold tracking-tight uppercase">Return Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Review and process customer refund requests with precision.</p>
          </div>

          <Card className="border-none shadow-2xl shadow-black/5 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-6 border-b border-border/40 space-y-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-11 bg-muted/40 border-border/40" placeholder="Search order number, customer, or comment..." />
              </div>
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex items-center gap-2 overflow-x-auto">
                  {['all', 'requested', 'approved', 'picked_up', 'refunded', 'rejected'].map((status) => (
                    <Button key={status} variant={statusFilter === status ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(status)} className="rounded-full px-4 text-xs uppercase font-bold">
                      {status === 'all' ? 'All Status' : status.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
                <Select value={reasonFilter} onValueChange={setReasonFilter}>
                  <SelectTrigger className="w-full lg:w-72">
                    <SelectValue placeholder="Filter by reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reasons</SelectItem>
                    {RETURN_REASON_OPTIONS.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="h-80 flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-30" /></div>
              ) : filteredReturns.length === 0 ? (
                <div className="text-center py-24 space-y-4"><Undo2 className="h-12 w-12 mx-auto text-muted-foreground opacity-20" /><p className="text-sm text-muted-foreground">No requests found</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30 text-[10px] uppercase font-bold tracking-widest text-muted-foreground border-b border-border/40">
                      <tr>
                        <th className="px-6 py-4 text-left">Order / Date</th><th className="px-6 py-4 text-left">Customer</th><th className="px-6 py-4 text-left">Items</th><th className="px-6 py-4 text-left">Amount</th><th className="px-6 py-4 text-left">Reason</th><th className="px-6 py-4 text-left">Status</th><th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredReturns.map((ret) => (
                        <tr key={String(ret.id)} className="hover:bg-muted/20">
                          <td className="px-6 py-5"><p className="font-bold text-xs">#{String(ret.orders?.order_id || ret.id || '').slice(0, 14)}</p><p className="text-[10px] text-muted-foreground">{ret.created_at ? format(new Date(String(ret.created_at)), 'dd MMM yyyy') : 'Unknown'}</p></td>
                          <td className="px-6 py-5 text-xs font-semibold">{String(ret.profiles?.display_name || 'Anonymous')}</td>
                          <td className="px-6 py-5">
                            <div className="space-y-2">
                              {(ret.items || []).slice(0, 2).map((item) => (
                                <div key={String(item.id)} className="flex items-center gap-3">
                                  <ProductImageViewer
                                    src={String(item.order_items?.product_image || DEFAULT_PRODUCT_IMAGE)}
                                    alt={String(item.order_items?.product_name || 'Product')}
                                    className="w-12 h-14 flex-shrink-0"
                                  />
                                  <p className="text-xs font-medium truncate max-w-[140px]">{String(item.order_items?.product_name || 'Order Item')}</p>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-5 text-xs font-bold">{formatPrice(computeRefundTotal(ret))}</td>
                          <td className="px-6 py-5">
                            <Badge className={getReturnReasonBadgeClass(String(ret.reason || 'other'))}>{getReturnReasonLabel(String(ret.reason || 'other'))}</Badge>
                            {ret.comment ? (
                              <Tooltip>
                                <TooltipTrigger asChild><p className="text-[11px] text-muted-foreground max-w-[160px] truncate mt-1 cursor-help">{String(ret.comment)}</p></TooltipTrigger>
                                <TooltipContent className="max-w-xs whitespace-pre-wrap">{String(ret.comment)}</TooltipContent>
                              </Tooltip>
                            ) : null}
                          </td>
                          <td className="px-6 py-5">{getStatusBadge(String(ret.status || ''))}</td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex justify-end flex-wrap gap-2">
                              <Button size="sm" variant="outline" onClick={() => { setSelectedReturn(ret); setAdminNoteDraft(String(ret.admin_note || '')); }}><Eye className="mr-1 h-3.5 w-3.5" />View</Button>
                              {ret.status === 'requested' ? <Button size="sm" onClick={() => updateStatus(ret, 'approved')}><CheckCircle className="mr-1 h-3.5 w-3.5" />Approve</Button> : null}
                              {ret.status === 'requested' ? <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => updateStatus(ret, 'rejected')}><XSquare className="mr-1 h-3.5 w-3.5" />Reject</Button> : null}
                              {ret.status === 'approved' ? <Button size="sm" className="bg-orange-500 hover:bg-orange-600" onClick={() => updateStatus(ret, 'picked_up')}><Box className="mr-1 h-3.5 w-3.5" />Picked Up</Button> : null}
                              {ret.status === 'picked_up' ? <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600" onClick={() => updateStatus(ret, 'refunded')}><CreditCard className="mr-1 h-3.5 w-3.5" />Refunded</Button> : null}
                              {ret.status === 'rejected' || ret.status === 'refunded' ? <div className="text-[10px] font-black text-muted-foreground uppercase bg-muted/40 px-3 py-1.5 rounded-lg border border-border/40 flex items-center gap-1"><Clock size={12} />Processed</div> : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={!!selectedReturn} onOpenChange={(open) => (!open ? setSelectedReturn(null) : null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedReturn ? (
              <div className="space-y-4">
                <DialogHeader><DialogTitle className="uppercase">Return Request Details</DialogTitle></DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Order</p><p className="font-bold">#{String(selectedReturn.orders?.order_id || selectedReturn.id || '').slice(0, 16)}</p><p className="text-xs text-muted-foreground mt-2">Customer</p><p>{String(selectedReturn.profiles?.display_name || 'Anonymous')}</p></CardContent></Card>
                  <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Reason</p><Badge className={getReturnReasonBadgeClass(String(selectedReturn.reason || 'other'))}>{getReturnReasonLabel(String(selectedReturn.reason || 'other'))}</Badge><p className="text-xs text-muted-foreground mt-2">Status</p>{getStatusBadge(String(selectedReturn.status || ''))}</CardContent></Card>
                </div>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Comment</p><p className="text-sm whitespace-pre-wrap">{String(selectedReturn.comment || 'No additional comment provided.')}</p></CardContent></Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-3">Products</p>
                    <div className="space-y-3">
                      {(selectedReturn.items || []).map((item) => (
                        <div key={String(item.id)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                          <ProductImageViewer
                            src={String(item.order_items?.product_image || DEFAULT_PRODUCT_IMAGE)}
                            alt={String(item.order_items?.product_name || 'Product')}
                            className="w-16 h-20 flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate">{String(item.order_items?.product_name || 'Order Item')}</p>
                            <p className="text-xs text-muted-foreground mt-1">Quantity: {Number(item.quantity || 0)}</p>
                            <p className="text-xs font-bold text-primary mt-1">{formatPrice(Number(item.order_items?.unit_price || 0))}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-3">Proof Images</p>{parseImageUrls(selectedReturn.images).length ? <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{parseImageUrls(selectedReturn.images).map((url, idx) => <ProductImageViewer key={url} src={url} alt={`Proof ${idx + 1}`} className="h-32 w-full" />)}</div> : <p className="text-sm text-muted-foreground">No images uploaded.</p>}</CardContent></Card>
                <Card><CardContent className="p-4 space-y-2"><p className="text-xs text-muted-foreground">Internal Admin Note</p><Textarea value={adminNoteDraft} onChange={(e) => setAdminNoteDraft(e.target.value)} placeholder="Private note..." /><div className="flex justify-end"><Button size="sm" variant="outline" onClick={() => updateReturnMutation.mutate({ id: String(selectedReturn.id), admin_note: adminNoteDraft.trim() ? adminNoteDraft.trim() : null })}>Save Note</Button></div></CardContent></Card>
                <div className="flex flex-wrap justify-end gap-2">
                  {selectedReturn.status === 'requested' ? <Button onClick={() => updateStatus(selectedReturn, 'approved')}>Approve</Button> : null}
                  {selectedReturn.status === 'requested' ? <Button variant="destructive" onClick={() => updateStatus(selectedReturn, 'rejected')}>Reject</Button> : null}
                  {selectedReturn.status === 'approved' ? <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => updateStatus(selectedReturn, 'picked_up')}>Mark Picked Up</Button> : null}
                  {selectedReturn.status === 'picked_up' ? <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={() => updateStatus(selectedReturn, 'refunded')}>Mark Refunded</Button> : null}
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    </AdminLayout>
  );
};

export default AdminReturns;
