-- Create admin_credentials table for secure admin login
CREATE TABLE public.admin_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- No direct access to admin_credentials table
CREATE POLICY "No direct access to admin_credentials" ON public.admin_credentials
FOR SELECT USING (false);

-- Create secure admin login function
CREATE OR REPLACE FUNCTION public.admin_login(p_username TEXT, p_password TEXT)
RETURNS TABLE (success BOOLEAN, admin_name TEXT, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin RECORD;
BEGIN
  SELECT * INTO v_admin 
  FROM public.admin_credentials 
  WHERE username = p_username 
    AND password_hash = p_password 
    AND is_active = true;
  
  IF v_admin.id IS NOT NULL THEN
    -- Update last login
    UPDATE public.admin_credentials SET last_login = now() WHERE id = v_admin.id;
    RETURN QUERY SELECT true, v_admin.display_name, NULL::TEXT;
  ELSE
    RETURN QUERY SELECT false, NULL::TEXT, 'Invalid credentials'::TEXT;
  END IF;
END;
$$;

-- Insert demo admin credentials
INSERT INTO public.admin_credentials (username, password_hash, display_name) 
VALUES ('demo123', 'demo123', 'Demo Admin');

-- Insert sample reviews for products
INSERT INTO public.reviews (user_id, product_id, rating, title, content, sentiment, is_verified_purchase, helpful_count, created_at) VALUES
-- Men's products reviews
('00000000-0000-0000-0000-000000000001', 'men-1', 5, 'Excellent Quality!', 'This shirt is amazing! The fabric is soft and the fit is perfect. Highly recommend for anyone looking for quality formal wear.', 'positive', true, 12, now() - interval '5 days'),
('00000000-0000-0000-0000-000000000002', 'men-1', 4, 'Great for Office', 'Perfect for daily office wear. Good value for money. The color is exactly as shown in pictures.', 'positive', true, 8, now() - interval '10 days'),
('00000000-0000-0000-0000-000000000003', 'men-1', 5, 'Premium Feel', 'Excellent quality fabric and stitching. Will definitely buy more colors.', 'positive', false, 5, now() - interval '15 days'),

('00000000-0000-0000-0000-000000000001', 'men-2', 5, 'Perfect Fit!', 'The slim fit is exactly what I was looking for. Great quality denim.', 'positive', true, 15, now() - interval '3 days'),
('00000000-0000-0000-0000-000000000002', 'men-2', 4, 'Good Quality Jeans', 'Comfortable and stylish. The stretch is perfect for all-day wear.', 'positive', true, 7, now() - interval '8 days'),

('00000000-0000-0000-0000-000000000001', 'men-3', 5, 'Love This Jacket!', 'Warm, stylish, and well-made. Perfect for winter outings.', 'positive', true, 20, now() - interval '2 days'),
('00000000-0000-0000-0000-000000000003', 'men-3', 4, 'Great Winter Essential', 'Good quality bomber jacket. Keeps me warm during cold mornings.', 'positive', true, 11, now() - interval '7 days'),
('00000000-0000-0000-0000-000000000002', 'men-3', 5, 'Stylish and Comfortable', 'Best jacket I have purchased. The material quality is outstanding.', 'positive', false, 9, now() - interval '12 days'),

('00000000-0000-0000-0000-000000000001', 'men-4', 4, 'Nice Casual Shirt', 'Great for casual outings. The fabric is breathable and comfortable.', 'positive', true, 6, now() - interval '4 days'),
('00000000-0000-0000-0000-000000000002', 'men-4', 5, 'Perfect Summer Wear', 'Light and airy. Perfect for hot summer days.', 'positive', true, 8, now() - interval '9 days'),

('00000000-0000-0000-0000-000000000003', 'men-5', 5, 'Excellent Trousers', 'Perfect fit and great quality. Very comfortable for office wear.', 'positive', true, 14, now() - interval '6 days'),
('00000000-0000-0000-0000-000000000001', 'men-5', 4, 'Good Value', 'Nice formal trousers at a reasonable price. Happy with the purchase.', 'positive', true, 5, now() - interval '11 days'),

('00000000-0000-0000-0000-000000000002', 'men-6', 5, 'Comfortable Polo', 'Soft fabric and great fit. Perfect for weekend outings.', 'positive', true, 10, now() - interval '1 day'),
('00000000-0000-0000-0000-000000000003', 'men-6', 4, 'Nice Quality', 'Good polo shirt. The collar stays in shape even after washing.', 'positive', false, 7, now() - interval '5 days'),
('00000000-0000-0000-0000-000000000001', 'men-6', 5, 'Best Polo Ever!', 'Bought 3 colors. Amazing quality and very comfortable.', 'positive', true, 12, now() - interval '8 days'),

-- Women's products reviews  
('00000000-0000-0000-0000-000000000001', 'women-1', 5, 'Beautiful Dress!', 'Absolutely stunning! The fabric drapes beautifully and the fit is perfect.', 'positive', true, 18, now() - interval '2 days'),
('00000000-0000-0000-0000-000000000002', 'women-1', 5, 'Perfect for Occasions', 'Wore this to a wedding and received so many compliments!', 'positive', true, 14, now() - interval '6 days'),
('00000000-0000-0000-0000-000000000003', 'women-1', 4, 'Lovely Design', 'Beautiful floral print. Very elegant and feminine.', 'positive', false, 9, now() - interval '10 days'),

('00000000-0000-0000-0000-000000000001', 'women-2', 5, 'Elegant Blouse', 'Perfect for work and casual outings. Love the quality!', 'positive', true, 11, now() - interval '3 days'),
('00000000-0000-0000-0000-000000000002', 'women-2', 4, 'Great for Office', 'Professional look with comfortable fit. Highly recommend.', 'positive', true, 8, now() - interval '7 days'),

('00000000-0000-0000-0000-000000000003', 'women-3', 5, 'Amazing Quality!', 'The material is luxurious and the fit is flattering. Worth every penny!', 'positive', true, 16, now() - interval '1 day'),
('00000000-0000-0000-0000-000000000001', 'women-3', 5, 'Stunning Piece', 'Received so many compliments. Beautiful design and excellent quality.', 'positive', true, 13, now() - interval '4 days'),
('00000000-0000-0000-0000-000000000002', 'women-3', 4, 'Love It!', 'Perfect addition to my wardrobe. Goes well with many outfits.', 'positive', false, 7, now() - interval '9 days'),

('00000000-0000-0000-0000-000000000001', 'women-4', 4, 'Comfortable Fit', 'Nice pants for everyday wear. Good quality at this price.', 'positive', true, 9, now() - interval '5 days'),
('00000000-0000-0000-0000-000000000003', 'women-4', 5, 'Perfect Trousers', 'Exactly what I was looking for. Great fit and comfortable.', 'positive', true, 11, now() - interval '8 days'),

('00000000-0000-0000-0000-000000000002', 'women-5', 5, 'Gorgeous Skirt!', 'Beautiful design and perfect length. Love wearing it!', 'positive', true, 15, now() - interval '2 days'),
('00000000-0000-0000-0000-000000000001', 'women-5', 4, 'Pretty Design', 'Nice skirt for casual outings. The fabric is light and flowy.', 'positive', true, 8, now() - interval '6 days'),
('00000000-0000-0000-0000-000000000003', 'women-5', 5, 'Must Have!', 'Absolutely love this skirt. It goes with everything!', 'positive', false, 10, now() - interval '11 days'),

('00000000-0000-0000-0000-000000000001', 'women-6', 5, 'Chic Jacket', 'Perfect lightweight jacket for spring. Very stylish!', 'positive', true, 12, now() - interval '3 days'),
('00000000-0000-0000-0000-000000000002', 'women-6', 4, 'Great Quality', 'Well-made jacket with nice detailing. Happy with my purchase.', 'positive', true, 9, now() - interval '7 days');