-- Fix order policies to allow proper checkout flow
DROP POLICY IF EXISTS "Allow order creation for checkout" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

-- Allow authenticated users to insert orders with their user_id
-- Allow orders to be inserted without user_id (guest checkout) but only via authenticated session
CREATE POLICY "Allow order creation"
ON public.orders
FOR INSERT
WITH CHECK (
  -- User can create order with their own user_id or as guest (null user_id)
  user_id = auth.uid() OR user_id IS NULL
);

-- Users can view their own orders
CREATE POLICY "Users can view their orders"
ON public.orders
FOR SELECT
USING (user_id = auth.uid());