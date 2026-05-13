-- Migration to enable real-time updates for orders and returns
-- This allows the frontend to receive instant updates when statuses change

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.return_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.return_request_items;
