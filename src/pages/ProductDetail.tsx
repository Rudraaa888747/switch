import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  ShoppingBag, 
  Truck, 
  RotateCcw,
  Shield,
  Star,
  Minus,
  Plus,
  Sparkles
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/products/ProductCard';
import ProductReviews from '@/components/reviews/ProductReviews';
import SmartRecommendations from '@/components/recommendations/SmartRecommendations';
import { getProductById, products, formatPrice, Product } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { toast } from '@/hooks/use-toast';
import { normalizeImageUrl } from '@/lib/utils';
import { useTrackBehavior } from '@/hooks/useTrackBehavior';

// Color mapping for visual swatches
const colorSwatchMap: Record<string, string> = {
  'Black': '#000000',
  'Navy': '#1a1a4e',
  'White': '#ffffff',
  'Cream': '#f5f5dc',
  'Blue Check': '#4a7cad',
  'Red Check': '#c44536',
  'Floral Pink': '#f8b4c4',
  'Floral Blue': '#87ceeb',
  'Dark Blue': '#1a3a5c',
  'Pink': '#ffc0cb',
  'Grey': '#808080',
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const product = getProductById(id || '');
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { trackBehavior } = useTrackBehavior();
  
  // Get first variant as default
  const defaultVariant = product?.variants?.[0] || null;
  
  const [selectedVariant, setSelectedVariant] = useState(defaultVariant);
  const [activeImage, setActiveImage] = useState(normalizeImageUrl(defaultVariant?.images?.[0] || ''));
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  const inWishlist = product ? isInWishlist(product.id) : false;

  // Track product view
  useEffect(() => {
    if (id) {
      trackBehavior(id, 'view');
    }
  }, [id, trackBehavior]);

  // Reset state when product changes
  useEffect(() => {
    if (product?.variants?.length) {
      const firstVariant = product.variants[0];
      setSelectedVariant(firstVariant);
      setActiveImage(normalizeImageUrl(firstVariant.images?.[0] || ''));
      setSelectedSize('');
      setQuantity(1);
    }
  }, [product?.id]);

  // Current images from selected variant
  const currentImages = useMemo(() => {
    return (selectedVariant?.images || [])
      .map((u) => normalizeImageUrl(u))
      .filter((u): u is string => Boolean(u));
  }, [selectedVariant]);

  // Handle color/variant selection
  const handleVariantSelect = (variant: { color: string; images: string[] }) => {
    setSelectedVariant(variant);
    setActiveImage(normalizeImageUrl(variant.images?.[0] || '')); // Set first image of new variant as active
  };

  if (!product) {
    return (
      <Layout>
        <div className="container-custom py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Link to="/shop" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </Layout>
    );
  }

  const matchingProducts = products
    .filter(p => 
      p.id !== product.id && 
      (p.category === product.category || p.occasion.some(o => product.occasion.includes(o)))
    )
    .slice(0, 4);

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast({
        title: 'Please select a size',
        variant: 'destructive',
      });
      return;
    }
    if (!selectedVariant) {
      toast({
        title: 'Please select a color',
        variant: 'destructive',
      });
      return;
    }

    addToCart(product, selectedSize, selectedVariant.color, quantity);
    trackBehavior(product.id, 'cart_add');
    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleBuyNow = () => {
    if (!selectedSize || !selectedVariant) {
      toast({
        title: 'Please select size and color',
        variant: 'destructive',
      });
      return;
    }
    addToCart(product, selectedSize, selectedVariant.color, quantity);
    trackBehavior(product.id, 'cart_add');
    window.location.href = '/checkout';
  };

  const handleWishlistToggle = () => {
    toggleWishlist(product);
    if (!inWishlist) {
      trackBehavior(product.id, 'wishlist_add');
    }
    toast({
      title: inWishlist ? 'Removed from wishlist' : 'Added to wishlist',
      description: inWishlist 
        ? `${product.name} has been removed from your wishlist.`
        : `${product.name} has been added to your wishlist.`,
    });
  };

  const handleImageNavigation = (direction: 'prev' | 'next') => {
    const currentIndex = currentImages.indexOf(activeImage);
    if (direction === 'prev') {
      const newIndex = currentIndex === 0 ? currentImages.length - 1 : currentIndex - 1;
      setActiveImage(currentImages[newIndex]);
    } else {
      const newIndex = currentIndex === currentImages.length - 1 ? 0 : currentIndex + 1;
      setActiveImage(currentImages[newIndex]);
    }
  };

  return (
    <Layout>
      {/* Breadcrumb */}
      <div className="container-custom py-4">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight size={14} />
          <Link to="/shop" className="hover:text-foreground transition-colors">Shop</Link>
          <ChevronRight size={14} />
          <Link to={`/shop?category=${product.category}`} className="hover:text-foreground transition-colors capitalize">
            {product.category}
          </Link>
          <ChevronRight size={14} />
          <span className="text-foreground line-clamp-1">{product.name}</span>
        </nav>
      </div>

      <div className="container-custom pb-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Main Image */}
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted">
              <motion.img
                key={activeImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNew && <span className="badge-new">NEW</span>}
                {product.discount && product.discount > 0 && (
                  <span className="badge-sale">-{product.discount}%</span>
                )}
              </div>

              {/* Navigation Arrows */}
              {currentImages.length > 1 && (
                <>
                  <button
                    onClick={() => handleImageNavigation('prev')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-background/90 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => handleImageNavigation('next')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-background/90 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Wishlist */}
              <motion.button 
                onClick={handleWishlistToggle}
                className={`absolute top-4 right-4 p-3 backdrop-blur-sm rounded-full transition-colors ${
                  inWishlist 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-background/90 hover:bg-background'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Heart size={20} className={inWishlist ? 'fill-current' : ''} />
              </motion.button>
            </div>

            {/* Thumbnails - Only show images of selected variant */}
            {currentImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {currentImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      activeImage === img 
                        ? 'border-primary ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <img src={img} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <p className="text-sm text-muted-foreground capitalize mb-2">{product.category}</p>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{product.name}</h1>
              
              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.floor(product.rating) 
                        ? 'fill-primary text-primary' 
                        : 'text-muted-foreground'}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.rating} ({product.reviews} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                    <span className="px-3 py-1 bg-destructive/10 text-destructive rounded-full text-sm font-medium">
                      {product.discount}% OFF
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Color Selection - Circular Swatches */}
            <div>
              <h3 className="font-medium mb-3">
                Color: <span className="text-muted-foreground">{selectedVariant?.color || 'Select'}</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((variant) => {
                  const swatchColor = colorSwatchMap[variant.color] || '#cccccc';
                  const isSelected = selectedVariant?.color === variant.color;
                  const isLight = ['White', 'Cream', 'Floral Pink', 'Pink'].includes(variant.color);
                  
                  return (
                    <button
                      key={variant.color}
                      onClick={() => handleVariantSelect(variant)}
                      className={`relative w-10 h-10 rounded-full transition-all duration-200 ${
                        isSelected 
                          ? 'ring-2 ring-offset-2 ring-primary' 
                          : 'hover:ring-2 hover:ring-offset-2 hover:ring-primary/50'
                      }`}
                      style={{ backgroundColor: swatchColor }}
                      title={variant.color}
                    >
                      {isSelected && (
                        <span 
                          className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${
                            isLight ? 'text-foreground' : 'text-white'
                          }`}
                        >
                          ✓
                        </span>
                      )}
                      {isLight && (
                        <span className="absolute inset-0 rounded-full border border-border" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Size: <span className="text-muted-foreground">{selectedSize || 'Select'}</span></h3>
                <button className="text-sm text-primary hover:underline">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[48px] h-12 px-3 rounded-lg border font-medium transition-all ${
                      selectedSize === size
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <h3 className="font-medium mb-3">Quantity</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-border rounded-lg">
                  <button
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="p-3 hover:bg-muted transition-colors"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(prev => prev + 1)}
                    className="p-3 hover:bg-muted transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <motion.button
                onClick={handleAddToCart}
                className="flex-1 btn-outline flex items-center justify-center gap-2"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <ShoppingBag size={20} />
                Add to Cart
              </motion.button>
              <motion.button
                onClick={handleBuyNow}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                Buy Now
              </motion.button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
              <div className="text-center">
                <Truck className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground">Free Delivery</p>
              </div>
              <div className="text-center">
                <RotateCcw className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground">Easy Returns</p>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-xs text-muted-foreground">Secure Payment</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="pt-6">
              <div className="flex gap-6 border-b border-border">
                {['description', 'details'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                      activeTab === tab
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="py-6">
                {activeTab === 'description' && (
                  <p className="text-muted-foreground">{product.description}</p>
                )}
                {activeTab === 'details' && (
                  <div className="space-y-3">
                    <p><strong>Fabric:</strong> {product.fabric}</p>
                    <p><strong>Occasion:</strong> {product.occasion.join(', ')}</p>
                    <p><strong>Category:</strong> <span className="capitalize">{product.category}</span></p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <section className="mt-20 pt-12 border-t border-border">
          <ProductReviews productId={product.id} />
        </section>

        {/* Smart Recommendations */}
        <section className="mt-20 pt-12 border-t border-border">
          <SmartRecommendations currentProductId={product.id} type="similar" limit={4} />
        </section>

        {/* Trending Products */}
        <section className="mt-16">
          <SmartRecommendations type="trending" limit={4} />
        </section>
      </div>
    </Layout>
  );
};

export default ProductDetail;
