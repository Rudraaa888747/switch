export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  category: 'men' | 'women';
  subcategory: string;
  colors: string[];
  sizes: string[];
  fabric: string;
  occasion: string[];
  description: string;
  isNew?: boolean;
  isTrending?: boolean;
  rating: number;
  reviews: number;

  // 🔥 Amazon-style variants
  variants: {
    color: string;
    images: string[];
  }[];

  // ⛑ optional (legacy support)
  image?: string;
  images?: string[];
}

export const products: Product[] = [
  // Men's Collection
  {
    id: 'men-1',
    name: 'Black Slim-Fit Cotton Shirt',
    price: 1299,
    originalPrice: 1799,
    discount: 28,
    category: 'men',
    subcategory: 'shirts',
    colors: ['Black', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    fabric: '100% Premium Cotton',
    occasion: ['Casual', 'Office', 'Party'],
    description: 'Premium slim-fit cotton shirt with a modern cut.',
    isNew: true,
    isTrending: true,
    rating: 4.5,
    reviews: 128,

    variants: [
      {
        color: 'Black',
        images: [
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/BLACK.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/BLACK%202.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/BLACK%203.jpeg',
        ],
      },
      {
        color: 'Navy',
        images: [
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/NAVY%201.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/NAVY%202.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/NAVY%203.jpg',
        ],
      },
    ],
  },

  {
    id: 'men-2',
    name: 'White Formal Shirt',
    price: 1499,
    originalPrice: 1999,
    discount: 25,
    category: 'men',
    subcategory: 'shirts',
    colors: ['White', 'Cream'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Egyptian Cotton Blend',
    occasion: ['Formal', 'Office', 'Wedding'],
    description: 'Classic white formal shirt crafted from premium Egyptian cotton blend.',
    rating: 4.7,
    reviews: 256,

    variants: [
      {
        color: 'White',
        images: [
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/WHITE.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/WHITE%202.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/WHITE%203.jpg',
        ],
      },
      {
        color: 'Cream',
        images: [
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/CREAM.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/CREAM%202.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/CREAM%203.jpg',
        ],
      },
    ],
  },
  {
    id: 'men-3',
    name: 'Oversized Graphic T-Shirt',
    price: 999,
    originalPrice: 1299,
    discount: 23,
    category: 'men',
    subcategory: 't-shirts',
    colors: ['Black', 'White'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    fabric: '100% Cotton Jersey',
    occasion: ['Casual', 'Streetwear'],
    description: 'Trendy oversized t-shirt with unique graphic prints.',
    isTrending: true,
    rating: 4.3,
    reviews: 89,
    variants: [
      {
        color: 'Black',
        images: [
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/BLACK%20T%20SHIRT.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/BLACK%20T%20SHIRT%202.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/BLACK%20T%20SHIRT%203.jpg',
        ],
      },
      {
        color: 'White',
        images: [
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/WHITE%20T%20SHIRT.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/WHITE%20T%20SHIRT%202.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/WHITE%20T%20SHIRT%203.jpg',
        ],
      },
    ],
  },
  {
    id: 'men-4',
    name: 'Premium Denim Jacket',
    price: 2499,
    originalPrice: 3499,
    discount: 29,
    category: 'men',
    subcategory: 'jackets',
    colors: ['Black'],
    sizes: ['S', 'M', 'L', 'XL'],
    fabric: 'Premium Denim',
    occasion: ['Casual', 'Streetwear', 'Travel'],
    description: 'Classic denim jacket with modern fit.',
    isNew: true,
    rating: 4.8,
    reviews: 167,

    variants: [
      {
        color: 'Black',
        images: [
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/JACKET.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/JACKET%202.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/JACKET%203.jpg',
        ],
      },
    ],
  },
  {
    id: 'men-5',
    name: 'Casual Checked Shirt',
    price: 1199,
    originalPrice: 1599,
    discount: 25,
    category: 'men',
    subcategory: 'shirts',
    colors: ['Blue Check', 'Red Check'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Cotton Flannel',
    occasion: ['Casual', 'Weekend'],
    description: 'Comfortable checked shirt in soft cotton flannel.',
    rating: 4.4,
    reviews: 92,

    variants: [
      {
        color: 'Blue Check',
        images: [
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/BLUE%20CHECKS.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/BLUE%20CHECKS%202.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/BLUE%20CHECKS%203.jpg',
        ],
      },
      {
        color: 'Red Check',
        images: [
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/RED%20CHECKS.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/RED%20CHECKS%202.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/tshirt/RED%20CHECKS%203.jpg',
        ],
      },
    ],
  },
  // Women's Collection
  {
    id: 'women-1',
    name: 'Floral Summer Dress',
    price: 1799,
    originalPrice: 2499,
    discount: 28,
    category: 'women',
    subcategory: 'dresses',
    colors: ['Floral Pink', 'Floral Blue'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    fabric: 'Viscose Crepe',
    occasion: ['Casual', 'Beach', 'Brunch'],
    description: 'Beautiful floral print summer dress in flowing viscose crepe.',
    isNew: true,
    isTrending: true,
    rating: 4.6,
    reviews: 203,

    variants: [
      {
        color: 'Floral Pink',
        images: [
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress/pink%20dress.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress/pink%20dress%202.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress/pink%20dress%203.jpg',
        ],
      },
      {
        color: 'Floral Blue',
        images: [
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress/floral%20blue.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress/floral%20blue%202.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress/floral%20blue%203.jpg',
        ],
      },
    ],
  },
  {
    id: 'women-2',
    name: 'Jeans',
    price: 1599,
    originalPrice: 2199,
    discount: 27,
    category: 'women',
    subcategory: 'jeans',
    colors: ['Dark Blue', 'Black'],
    sizes: ['26', '28', '30', '32', '34'],
    fabric: 'Stretch Denim',
    occasion: ['Casual', 'Office', 'Travel'],
    description: 'Flattering high-waist jeans with comfortable stretch.',
    isTrending: true,
    rating: 4.5,
    reviews: 312,
    variants: [
      {
        color: 'Dark Blue',
        images: [
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress/dark%20blue.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress/dark%20blue%202.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress/dark%20blue%203.jpg',
        ],
      },
      {
        color: 'Black',
        images: [
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress/black%20jeans.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress/black%20jeans%202.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress/black%20jeans%203.jpg',
        ],
      },
    ],
  },
  {
    id: 'women-3',
    name: 'Elegant Cotton Kurti',
    price: 1299,
    originalPrice: 1799,
    discount: 28,
    category: 'women',
    subcategory: 'kurta',
    colors: ['White', 'Navy'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    fabric: 'Pure Cotton',
    occasion: ['Casual', 'Office', 'Festival'],
    description: 'Elegant pure cotton kurti with beautiful embroidery.',
    rating: 4.7,
    reviews: 445,

    variants: [
      {
        color: 'White',
        images: [
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress/white%20kurti.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress/white%20kurti%202.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress/white%20kurti%203.jpg',
        ],
      },
      {
        color: 'Navy',
        images: [
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress/Navy%20kurti.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress/Navy%20kurti%202.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress/Navy%20kurti%203.jpg',
        ],
      },
    ],
  },
  {
    id: 'women-4',
    name: 'Oversized Hoodie',
    price: 1999,
    originalPrice: 2599,
    discount: 23,
    category: 'women',
    subcategory: 'hoodies',
    colors: ['Pink', 'Grey'],
    sizes: ['S', 'M', 'L', 'XL'],
    fabric: 'Cotton Fleece',
    occasion: ['Casual', 'Loungewear', 'Travel'],
    description: 'Cozy oversized hoodie in soft cotton fleece.',
    isNew: true,
    rating: 4.4,
    reviews: 178,
    variants: [
      {
        color: 'Pink',
        images: [
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress/pink%20hoddie.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress/pink%20hoddie%202.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress/pink%20hoddie%203.jpg',
        ],
      },
      {
        color: 'Grey',
        images: [
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress/Grey%20Hoddie.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress/Grey%20Hoddie%202.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/womendress/Grey%20Hoddie%203.jpg',
        ],
      },
    ],
  },
  // Men's Additional
  {
    id: 'men-6',
    name: 'Oversized Hoodie',
    price: 1899,
    originalPrice: 2499,
    discount: 24,
    category: 'men',
    subcategory: 'hoodies',
    colors: ['Black'],
    sizes: ['S', 'M', 'L', 'XL'],
    fabric: 'Premium Cotton Fleece',
    occasion: ['Casual', 'Streetwear', 'Travel'],
    description: 'Premium oversized hoodie with kangaroo pocket.',
    isNew: true,
    isTrending: true,
    rating: 4.6,
    reviews: 523,

    variants: [
      {
        color: 'Black',
        images: [
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/unisexx/black%20uni.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/unisexx/black%20uni%202.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/unisexx/black%20uni%203.jpg',
        ],
      },
    ],
  },
  {
    id: 'men-7',
    name: 'Premium Sneakers',
    price: 2499,
    originalPrice: 3499,
    discount: 29,
    category: 'men',
    subcategory: 'footwear',
    colors: ['Black'],
    sizes: ['6', '7', '8', '9', '10', '11'],
    fabric: 'Mesh & Synthetic',
    occasion: ['Casual', 'Sports', 'Streetwear'],
    description: 'Trendy sneakers with premium cushioning.',
    isTrending: true,
    rating: 4.7,
    reviews: 412,
    variants: [
      {
        color: 'Black',
        images: [
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/unisexx/shoes.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/unisexx/shoes%202.jpg',
          'https://xrlobwvtxkehazwrqtgq.supabase.co/storage/v1/object/public/unisexx/shoes%203.jpg',
        ],
      },
    ],
  },
];

export const getProductById = (id: string): Product | undefined => {
  return products.find(p => p.id === id);
};

export const getProductsByCategory = (category: 'men' | 'women' | 'unisex'): Product[] => {
  return products.filter(p => p.category === category);
};

export const getTrendingProducts = (): Product[] => {
  return products.filter(p => p.isTrending);
};

export const getNewArrivals = (): Product[] => {
  return products.filter(p => p.isNew);
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(price);
};
