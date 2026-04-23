-- Recreate orders table with new structure for individual order items
-- Drop existing orders table
DROP TABLE IF EXISTS public.orders CASCADE;

-- Create new orders table (one row per product in order)
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price INTEGER NOT NULL, -- price * quantity
  order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'Order Placed' CHECK (status IN ('Order Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled')),
  estimated_delivery_date DATE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own orders
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own orders
CREATE POLICY "Users can insert their own orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own orders (for cancellation)
CREATE POLICY "Users can update their own orders"
ON public.orders
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Admins can view all orders
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (EXISTS (SELECT 1 FROM public.admin_credentials WHERE username = current_setting('request.jwt.claims', true)::json->>'email' AND is_active = true));

-- Policy: Admins can update all orders
CREATE POLICY "Admins can update all orders"
ON public.orders
FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.admin_credentials WHERE username = current_setting('request.jwt.claims', true)::json->>'email' AND is_active = true));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);