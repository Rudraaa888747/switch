import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Easing } from 'framer-motion';
import { ShoppingBag, Heart, Eye } from 'lucide-react';
import { Product, formatPrice } from '@/data/products';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { toast } from '@/hooks/use-toast';
import { normalizeImageUrl } from '@/lib/utils';
import ProductQuickView from './ProductQuickView';

interface ProductCardProps {
  product: Product;
  index?: number;
}

// Premium easing curve
const premiumEase: Easing = [0.4, 0, 0.2, 1];

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const inWishlist = isInWishlist(product.id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, product.sizes[0], product.colors[0]);
    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
    toast({
      title: inWishlist ? 'Removed from wishlist' : 'Added to wishlist',
      description: inWishlist 
        ? `${product.name} has been removed from your wishlist.`
        : `${product.name} has been added to your wishlist.`,
    });
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsQuickViewOpen(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.5, delay: index * 0.08, ease: premiumEase }}
        whileHover={{ y: -8 }}
        className="group product-card-premium"
      >
        <Link to={`/product/${product.id}`} className="block">
          <motion.div 
            className="relative aspect-product overflow-hidden bg-muted mb-4"
            whileHover={{ boxShadow: '0 20px 40px -12px rgba(0,0,0,0.15)' }}
            transition={{ duration: 0.4, ease: premiumEase }}
          >
            {/* Product Image with Premium Hover Effect */}
            <motion.img
              src={normalizeImageUrl(product.variants?.[0]?.images?.[0] || product.image || product.images?.[0] || '')}
              alt={product.name}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.6, ease: premiumEase }}
              loading="lazy"
            />
            
            {/* Subtle Overlay on Hover */}
            <motion.div 
              className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-500" 
            />
            
            {/* Hover Actions - Fade In Smoothly */}
            <div className="absolute inset-0">
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                {/* Wishlist Button */}
                <motion.button
                  onClick={handleWishlistToggle}
                  className={`p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 ${
                    inWishlist 
                      ? 'bg-foreground text-background' 
                      : 'bg-background/90 backdrop-blur-sm hover:bg-foreground hover:text-background'
                  }`}
                  style={{ transitionDelay: '0.05s' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
                </motion.button>

                {/* Quick View Button */}
                <motion.button
                  onClick={handleQuickView}
                  className="p-2 bg-background/90 backdrop-blur-sm rounded-full hover:bg-foreground hover:text-background transition-all duration-300 opacity-0 group-hover:opacity-100"
                  style={{ transitionDelay: '0.1s' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Quick view"
                >
                  <Eye className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
            
            {/* Always visible wishlist button on mobile */}
            <button
              onClick={handleWishlistToggle}
              className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-300 md:hidden ${
                inWishlist 
                  ? 'bg-foreground text-background' 
                  : 'bg-background/90 backdrop-blur-sm'
              }`}
              aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
            </button>
            
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {product.isNew && (
                <motion.span 
                  className="badge-new"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  New
                </motion.span>
              )}
              {product.discount && product.discount > 0 && (
                <motion.span 
                  className="badge-sale"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  -{product.discount}%
                </motion.span>
              )}
            </div>
          </motion.div>

          <div className="space-y-2">
            <motion.h3 
              className="text-sm font-medium line-clamp-1 transition-colors duration-300 group-hover:text-foreground/80"
              whileHover={{ x: 2 }}
            >
              {product.name}
            </motion.h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{formatPrice(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>
            
            {/* Quick Add Button with Premium Hover */}
            <motion.button
              onClick={handleQuickAdd}
              className="w-full mt-3 py-2 border border-foreground text-foreground text-xs uppercase tracking-widest font-medium 
                       flex items-center justify-center gap-2 transition-all duration-300
                       hover:bg-foreground hover:text-background btn-shine"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              Quick Add
            </motion.button>
          </div>
        </Link>
      </motion.div>

      {/* Quick View Modal */}
      <ProductQuickView
        product={product}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </>
  );
};

export default ProductCard;