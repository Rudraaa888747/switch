import { useCallback, useMemo, useState } from 'react';
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

const premiumEase: Easing = [0.22, 1, 0.36, 1];

const preloadImage = (url: string) => {
  if (!url || typeof document === 'undefined') return;
  const existing = document.querySelector(`link[href="${url}"]`);
  if (existing) return;
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'image';
  link.href = url;
  document.head.appendChild(link);
};

const prefetchProductPage = () => {
  import('@/pages/ProductDetail');
};

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const inWishlist = isInWishlist(product.id);

  const imageUrl = useMemo(
    () => normalizeImageUrl(product.variants?.[0]?.images?.[0] || product.image || product.images?.[0] || ''),
    [product],
  );

  const handlePrefetch = useCallback(() => {
    prefetchProductPage();
    preloadImage(imageUrl);
  }, [imageUrl]);

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
      description: inWishlist ? `${product.name} has been removed from your wishlist.` : `${product.name} has been added to your wishlist.`,
    });
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsQuickViewOpen(true);
  };

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-24px' }}
        transition={{ duration: 0.48, delay: index * 0.06, ease: premiumEase }}
        whileHover={{ y: -6 }}
        className="product-card-premium group h-full"
      >
        <Link
          to={`/product/${product.id}`}
          className="flex h-full flex-col"
          onMouseEnter={handlePrefetch}
          onTouchStart={handlePrefetch}
          onFocus={handlePrefetch}
        >
          <div className="theme-elevated flex h-full flex-col overflow-hidden rounded-[1.55rem] p-2.5 md:p-3">
            <motion.div className="theme-image-stage relative mb-3 overflow-hidden rounded-[1.2rem] md:mb-4" whileHover={{ boxShadow: '0 24px 50px -22px rgba(0,0,0,0.2)' }}>
              <motion.div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="image-fade-wrap aspect-[3/4] flex items-center justify-center overflow-hidden bg-[#f9f9f9] dark:bg-[#0a0a0a]" data-loaded={imageLoaded}>
                <motion.img
                  src={imageUrl}
                  alt={product.name}
                  className="image-fade h-full w-full object-cover object-top"
                  data-loaded={imageLoaded}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 1.02 }}
                  transition={{ duration: 0.8, ease: premiumEase }}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  decoding="async"
                  onLoad={() => setImageLoaded(true)}
                />
              </div>

            <motion.div className="absolute inset-0 bg-gradient-to-t from-black/14 via-transparent to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="absolute left-3 top-3 flex flex-col gap-2">
              {product.isNew && (
                <motion.span className="badge-new" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.16 }}>
                  New
                </motion.span>
              )}
              {product.discount && product.discount > 0 && (
                <motion.span className="badge-sale" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.24 }}>
                  -{product.discount}%
                </motion.span>
              )}
            </div>

            <div className="absolute right-3 top-3 flex flex-col gap-2">
              <motion.button
                onClick={handleWishlistToggle}
                className={`touch-target rounded-full border backdrop-blur-xl transition-all duration-300 ${
                  inWishlist ? 'border-primary bg-primary text-primary-foreground' : 'border-foreground/10 bg-background/60 text-foreground hover:border-foreground/30 hover:bg-background/80'
                }`}
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.04 }}
                aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart className={`h-[1.05rem] w-[1.05rem] ${inWishlist ? 'fill-current' : ''}`} />
              </motion.button>

              <motion.button
                onClick={handleQuickView}
                className="hidden rounded-full border border-foreground/10 bg-background/60 p-2.5 text-foreground backdrop-blur-xl transition-all duration-300 hover:border-foreground/30 hover:bg-background/80 md:flex"
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.04 }}
                aria-label="Quick view"
              >
                <Eye className="h-4 w-4" />
              </motion.button>
            </div>
            </motion.div>

            <div className="flex min-h-[10.5rem] flex-1 flex-col gap-2 px-1 pb-1">
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{product.category}</p>
                <motion.h3 className="line-clamp-2 min-h-[3rem] text-[0.95rem] font-medium leading-6" whileHover={{ x: 2 }}>
                  {product.name}
                </motion.h3>
              </div>

              <div className="flex min-h-[1.75rem] items-end gap-2">
                <span className="text-[0.98rem] font-semibold tracking-tight">{formatPrice(product.price)}</span>
                {product.originalPrice && <span className="text-xs text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>}
              </div>

              <div className="mt-auto pt-3">
                <motion.button
                  onClick={handleQuickAdd}
                  className="btn-shine tap-lift touch-pill flex w-full items-center justify-center gap-2 border border-foreground/16 bg-foreground/[0.05] px-4 py-3 text-[10px] font-medium uppercase tracking-[0.24em] text-foreground shadow-[0_18px_35px_-28px_hsl(var(--foreground)/0.42),inset_0_1px_0_rgba(255,255,255,0.16)] transition-all duration-300 group-hover:border-foreground/40 group-hover:bg-foreground/[0.1]"
                  whileTap={{ scale: 0.98 }}
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Quick Add
                </motion.button>
              </div>
            </div>
          </div>
        </Link>
      </motion.article>

      <ProductQuickView product={product} isOpen={isQuickViewOpen} onClose={() => setIsQuickViewOpen(false)} />
    </>
  );
};

export default ProductCard;
