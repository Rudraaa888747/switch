-- 1. Create the products table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    discount NUMERIC,
    category TEXT NOT NULL,
    subcategory TEXT,
    colors TEXT[],
    sizes TEXT[],
    fabric TEXT,
    occasion TEXT[],
    description TEXT,
    is_new BOOLEAN DEFAULT false,
    is_trending BOOLEAN DEFAULT false,
    rating NUMERIC DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    variants JSONB DEFAULT '[]'::jsonb,
    image_url TEXT,
    stock_quantity INTEGER DEFAULT 20,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 3. Create Security Policies
-- Allow anyone to view products
DROP POLICY IF EXISTS "Allow public read access" ON public.products;
CREATE POLICY "Allow public read access" 
ON public.products FOR SELECT 
USING (true);

-- Allow admins (or everyone for this demo) to manage products
DROP POLICY IF EXISTS "Allow all management for now" ON public.products;
CREATE POLICY "Allow all management for now" 
ON public.products FOR ALL 
USING (true)
WITH CHECK (true);

-- 4. Seed with ALL 11 initial products from your catalog
INSERT INTO public.products (id, name, price, original_price, discount, category, subcategory, colors, sizes, fabric, occasion, description, is_new, is_trending, rating, reviews_count, variants, stock_quantity, image_url)
VALUES 
  ('men-1', 'Black Slim-Fit Cotton Shirt', 1299, 1799, 28, 'men', 'shirts', ARRAY['Black', 'Navy'], ARRAY['S', 'M', 'L', 'XL', 'XXL'], '100% Premium Cotton', ARRAY['Casual', 'Office', 'Party'], 'Premium slim-fit cotton shirt with a modern cut.', true, true, 4.5, 128, '[{"color": "Black", "images": ["https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//BLACK.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//BLACK 2.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//BLACK 3.jpeg"]}, {"color": "Navy", "images": ["https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//NAVY 1.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//NAVY 2.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//NAVY 3.jpg"]}]'::jsonb, 45, 'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//BLACK.jpg'),
  ('men-2', 'White Formal Shirt', 1499, 1999, 25, 'men', 'shirts', ARRAY['White', 'Cream'], ARRAY['S', 'M', 'L', 'XL', 'XXL'], 'Egyptian Cotton Blend', ARRAY['Formal', 'Office', 'Wedding'], 'Classic white formal shirt crafted from premium Egyptian cotton blend.', false, false, 4.7, 256, '[{"color": "White", "images": ["https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//WHITE.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//WHITE 2.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//WHITE 3.jpg"]}, {"color": "Cream", "images": ["https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//CREAM.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//CREAM 2.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//CREAM 3.jpg"]}]'::jsonb, 12, 'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//WHITE.jpg'),
  ('men-3', 'Oversized Graphic T-Shirt', 999, 1299, 23, 'men', 't-shirts', ARRAY['Black', 'White'], ARRAY['S', 'M', 'L', 'XL', 'XXL'], '100% Cotton Jersey', ARRAY['Casual', 'Streetwear'], 'Trendy oversized t-shirt with unique graphic prints.', false, true, 4.3, 89, '[{"color": "Black", "images": ["https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//BLACK T SHIRT.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//BLACK T SHIRT 2.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//BLACK T SHIRT 3.jpg"]}, {"color": "White", "images": ["https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//WHITE T SHIRT.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//WHITE T SHIRT 2.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//WHITE T SHIRT 3.jpg"]}]'::jsonb, 20, 'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//BLACK T SHIRT.jpg'),
  ('men-4', 'Premium Denim Jacket', 2499, 3499, 29, 'men', 'jackets', ARRAY['Black'], ARRAY['S', 'M', 'L', 'XL'], 'Premium Denim', ARRAY['Casual', 'Streetwear', 'Travel'], 'Classic denim jacket with modern fit.', true, false, 4.8, 167, '[{"color": "Black", "images": ["https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//JACKET.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//JACKET 2.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//JACKET 3.jpg"]}]'::jsonb, 30, 'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//JACKET.jpg'),
  ('men-5', 'Casual Checked Shirt', 1199, 1599, 25, 'men', 'shirts', ARRAY['Blue Check', 'Red Check'], ARRAY['S', 'M', 'L', 'XL', 'XXL'], 'Cotton Flannel', ARRAY['Casual', 'Weekend'], 'Comfortable checked shirt in soft cotton flannel.', false, false, 4.4, 92, '[{"color": "Blue Check", "images": ["https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//BLUE CHECKS.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//BLUE CHECKS 2.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//BLUE CHECKS 3.jpg"]}, {"color": "Red Check", "images": ["https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//RED CHECKS.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//RED CHECKS 2.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//RED CHECKS 3.jpg"]}]'::jsonb, 5, 'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt//BLUE CHECKS.jpg'),
  ('women-1', 'Floral Summer Dress', 1799, 2499, 28, 'women', 'dresses', ARRAY['Floral Pink', 'Floral Blue'], ARRAY['XS', 'S', 'M', 'L', 'XL'], 'Viscose Crepe', ARRAY['Casual', 'Beach', 'Brunch'], 'Beautiful floral print summer dress in flowing viscose crepe.', true, true, 4.6, 203, '[{"color": "Floral Pink", "images": ["https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//pink dress.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//pink dress 2.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//pink dress 3.jpg"]}, {"color": "Floral Blue", "images": ["https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//floral blue.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//floral blue 2.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//floral blue 3.jpg"]}]'::jsonb, 35, 'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//pink dress.jpg'),
  ('women-2', 'High-Waist Stretch Jeans', 1599, 2199, 27, 'women', 'jeans', ARRAY['Dark Blue', 'Black'], ARRAY['26', '28', '30', '32', '34'], 'Stretch Denim', ARRAY['Casual', 'Office', 'Travel'], 'Flattering high-waist jeans with comfortable stretch.', false, true, 4.5, 312, '[{"color": "Dark Blue", "images": ["https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//dark blue.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//dark blue 2.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//dark blue 3.jpg"]}, {"color": "Black", "images": ["https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//black jeans.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//black jeans 2.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//black jeans 3.jpg"]}]'::jsonb, 18, 'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//dark blue.jpg'),
  ('women-3', 'Elegant Cotton Kurti', 1299, 1799, 28, 'women', 'kurta', ARRAY['White', 'Navy'], ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL'], 'Pure Cotton', ARRAY['Casual', 'Office', 'Festival'], 'Elegant pure cotton kurti with beautiful embroidery.', false, false, 4.7, 445, '[{"color": "White", "images": ["https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//white kurti.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//white kurti 2.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//white kurti 3.jpg"]}, {"color": "Navy", "images": ["https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//Navy kurti.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//Navy kurti 2.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//Navy kurti 3.jpg"]}]'::jsonb, 3, 'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//white kurti.jpg'),
  ('women-4', 'Oversized Hoodie', 1999, 2599, 23, 'women', 'hoodies', ARRAY['Pink', 'Grey'], ARRAY['S', 'M', 'L', 'XL'], 'Cotton Fleece', ARRAY['Casual', 'Loungewear', 'Travel'], 'Cozy oversized hoodie in soft cotton fleece.', true, false, 4.4, 178, '[{"color": "Pink", "images": ["https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//pink hoddie.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//pink hoddie 2.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//pink hoddie 3.jpg"]}, {"color": "Grey", "images": ["https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//Grey Hoddie.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//Grey Hoddie 2.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//Grey Hoddie 3.jpg"]}]'::jsonb, 28, 'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress//pink hoddie.jpg'),
  ('men-6', 'Oversized Hoodie (Unisex)', 1899, 2499, 24, 'men', 'hoodies', ARRAY['Black'], ARRAY['S', 'M', 'L', 'XL'], 'Premium Cotton Fleece', ARRAY['Casual', 'Streetwear', 'Travel'], 'Premium oversized hoodie with kangaroo pocket.', true, true, 4.6, 523, '[{"color": "Black", "images": ["https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/unisexx//black uni.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/unisexx//black uni 2.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/unisexx//black uni 3.jpg"]}]'::jsonb, 22, 'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/unisexx//black uni.jpg'),
  ('men-7', 'Premium Sneakers', 2499, 3499, 29, 'men', 'footwear', ARRAY['Black'], ARRAY['6', '7', '8', '9', '10', '11'], 'Mesh & Synthetic', ARRAY['Casual', 'Sports', 'Streetwear'], 'Trendy sneakers with premium cushioning.', false, true, 4.7, 412, '[{"color": "Black", "images": ["https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/unisexx//shoes.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/unisexx//shoes 2.jpg", "https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/unisexx//shoes 3.jpg"]}]'::jsonb, 20, 'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/unisexx//shoes.jpg')
ON CONFLICT (id) DO UPDATE SET
  price = EXCLUDED.price,
  stock_quantity = EXCLUDED.stock_quantity;
