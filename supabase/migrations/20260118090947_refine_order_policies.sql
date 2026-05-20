-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can view orders by order_id" ON public.orders;
DROP POLICY IF EXISTS "Users can insert orders" ON public.orders;

-- Create more specific policies for orders
-- Allow anyone to insert orders (needed for guest checkout)
CREATE POLICY "Allow order creation for checkout"
ON public.orders
FOR INSERT
WITH CHECK (
  -- Authenticated users must use their own user_id
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR 
  -- Guest users can create orders with null user_id
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- Users can view their own orders, guests cannot view orders via API (they get confirmation on page)
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id);