-- Add indexes for fast order queries (user_id, product_id) and for coupon lookups

CREATE INDEX IF NOT EXISTS idx_orders_product_id ON public.orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON public.orders(order_date DESC);

-- The coupons table already has a unique index on code (from UNIQUE constraint), but ensure it exists
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
