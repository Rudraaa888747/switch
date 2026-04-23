import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  ShoppingBag, 
  Minus, 
  Plus,
  Star,
  ExternalLink
} from 'lucide-react';
import { Product, formatPrice } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { toast } from '@/hooks/use-toast';
import { normalizeImageUrl } from '@/lib/utils';

interface ProductQuickViewProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

const ProductQuickView = ({ product, isOpen, onClose }: ProductQuickViewProps) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState(product.variants?.[0]?.color || product.colors[0] || '');
  const [quantity, setQuantity] = useState(1);

  const inWishlist = isInWishlist(product.id);

  // Get images from variants or fallback to legacy images
  const images = useMemo(() => {
    const raw =
      product.variants && product.variants.length > 0
        ? (product.variants.find((v) => v.color === selectedColor) || product.variants[0])?.images || []
        : product.images || (product.image ? [product.image] : []);

    return raw
      .map((u) => normalizeImageUrl(u))
      .filter((u): u is string => Boolean(u));
  }, [product, selectedColor]);

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast({
        title: 'Please select a size',
        variant: 'destructive',
      });
      return;
    }
    if (!selectedColor) {
      toast({
        title: 'Please select a color',
        variant: 'destructive',
      });
      return;
    }

    addToCart(product, selectedSize, selectedColor, quantity);
    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart.`,
    });
    onClose();
  };

  const handleWishlistToggle = () => {
    toggleWishlist(product);
    toast({
      title: inWishlist ? 'Removed from wishlist' : 'Added to wishlist',
      description: inWishlist 
        ? `${product.name} has been removed from your wishlist.`
        : `${product.name} has been added to your wishlist.`,
    });
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    setCurrentImageIndex(prev => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-4xl max-h-[90vh] bg-background border border-border overflow-hidden relative">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-background/90 backdrop-blur-sm hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="grid md:grid-cols-2 h-full max-h-[90vh] overflow-y-auto">
              {/* Image Section */}
              <div className="relative bg-muted aspect-square md:aspect-auto md:h-full">
                <img
                  src={images[currentImageIndex] || normalizeImageUrl(product.image) || ''}
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

                {/* Image Navigation */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-background/90 backdrop-blur-sm hover:bg-background transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-background/90 backdrop-blur-sm hover:bg-background transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>

                    {/* Image Dots */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            currentImageIndex === idx ? 'bg-foreground' : 'bg-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Product Details */}
              <div className="p-6 md:p-8 overflow-y-auto">
                <div className="space-y-5">
                  {/* Category */}
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {product.category}
                  </p>

                  {/* Name */}
                  <h2 className="text-2xl md:text-3xl font-light tracking-wide">
                    {product.name}
                  </h2>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={i < Math.floor(product.rating) 
                            ? 'fill-foreground text-foreground' 
                            : 'text-muted-foreground/30'}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({product.reviews} reviews)
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-medium">{formatPrice(product.price)}</span>
                    {product.originalPrice && (
                      <>
                        <span className="text-lg text-muted-foreground line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                        <span className="px-2 py-1 bg-foreground text-background text-xs font-medium">
                          {product.discount}% OFF
                        </span>
                      </>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>

                  {/* Color Selection */}
                  <div>
                    <h3 className="text-xs uppercase tracking-widest mb-3">
                      Color: <span className="text-muted-foreground">{selectedColor || 'Select'}</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => handleColorChange(color)}
                          className={`px-4 py-2 text-sm border transition-all ${
                            selectedColor === color
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-border hover:border-foreground'
                          }`}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Size Selection */}
                  <div>
                    <h3 className="text-xs uppercase tracking-widest mb-3">
                      Size: <span className="text-muted-foreground">{selectedSize || 'Select'}</span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`w-12 h-12 text-sm border transition-all ${
                            selectedSize === size
                              ? 'border-foreground bg-foreground text-background'
                              : 'border-border hover:border-foreground'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <h3 className="text-xs uppercase tracking-widest mb-3">Quantity</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-border">
                        <button
                          onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                          className="p-3 hover:bg-muted transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-12 text-center font-medium">{quantity}</span>
                        <button
                          onClick={() => setQuantity(prev => prev + 1)}
                          className="p-3 hover:bg-muted transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 btn-primary flex items-center justify-center gap-2"
                    >
                      <ShoppingBag size={18} />
                      Add to Cart
                    </button>
                    <button
                      onClick={handleWishlistToggle}
                      className={`p-4 border transition-all ${
                        inWishlist 
                          ? 'bg-foreground text-background border-foreground' 
                          : 'border-border hover:border-foreground'
                      }`}
                      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* View Full Details Link */}
                  <Link
                    to={`/product/${product.id}`}
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View Full Details
                    <ExternalLink size={14} />
                  </Link>
                </div>
              </div>
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProductQuickView;
