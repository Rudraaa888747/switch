-- Create coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  sentiment TEXT DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  is_verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Create user_behavior table for recommendations
CREATE TABLE public.user_behavior (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT,
  product_id TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'cart_add', 'wishlist_add', 'purchase')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior ENABLE ROW LEVEL SECURITY;

-- Coupon policies (public read for validation)
CREATE POLICY "Anyone can view active coupons" ON public.coupons
FOR SELECT USING (is_active = true);

-- Review policies
CREATE POLICY "Anyone can view reviews" ON public.reviews
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reviews" ON public.reviews
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.reviews
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON public.reviews
FOR DELETE USING (auth.uid() = user_id);

-- User behavior policies
CREATE POLICY "Anyone can insert behavior" ON public.user_behavior
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own behavior" ON public.user_behavior
FOR SELECT USING ((auth.uid() = user_id) OR (user_id IS NULL));

-- Create trigger for reviews updated_at
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample coupons
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_amount, is_active) VALUES
('WELCOME10', 'percentage', 10, 500, true),
('FLAT200', 'flat', 200, 1500, true),
('PREMIUM15', 'percentage', 15, 2000, true),
('SWITCH50', 'flat', 50, 0, true);