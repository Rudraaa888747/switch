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
import { normalizeImageUrl, cleanProductTitle, rewriteToLuxuryDescription } from '@/lib/utils';

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
  const [selectedColor, setSelectedColor] = useState(product.variants?.[0]?.color || product.colors?.[0] || '');
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-50"
          />

          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6"
          >
        <div className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-t-[2rem] border border-border/60 bg-card shadow-[0_40px_90px_-40px_hsl(var(--foreground)/0.65)] md:max-h-[88vh] md:flex-row md:rounded-[2rem]">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md transition-all hover:bg-black/60 md:right-4 md:top-4 md:h-9 md:w-9"
            aria-label="Close"
          >
            <X size={16} />
          </button>

          {/* Mobile drag handle */}
          <div className="absolute left-1/2 top-2 z-20 h-1 w-10 -translate-x-1/2 rounded-full bg-muted-foreground/30 md:hidden" />

          <div className="relative flex w-full flex-shrink-0 items-center justify-center bg-gradient-to-br from-muted/55 via-muted/20 to-background md:min-h-[42rem] md:w-[48%]">
            <div className="pointer-events-none absolute inset-x-10 top-8 h-28 rounded-full bg-foreground/5 blur-3xl md:top-10" />
            <div className="flex aspect-[4/5] w-full items-center justify-center px-4 py-10 md:h-full md:px-8 md:py-10">
              <div className="theme-elevated flex h-full w-full items-center justify-center rounded-[1.6rem] p-4 md:p-6">
                <img
                  src={images[currentImageIndex] || normalizeImageUrl(product.image) || ''}
                  alt={product.name}
                  className="h-full w-full object-cover object-center"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            </div>

            <div className="absolute left-3 top-3 flex flex-col gap-2 md:left-4 md:top-4">
              {product.isNew && <span className="badge-new">NEW</span>}
              {product.discount && product.discount > 0 && (
                <span className="badge-sale">-{product.discount}%</span>
              )}
            </div>

            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white backdrop-blur-md transition-all hover:bg-black/60 md:left-4"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white backdrop-blur-md transition-all hover:bg-black/60 md:right-4"
                >
                  <ChevronRight size={16} />
                </button>
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        currentImageIndex === idx ? 'w-5 bg-foreground' : 'w-1.5 bg-foreground/30'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="custom-scrollbar flex-1 overflow-y-auto p-5 pb-32 md:p-8 md:pb-32">
              <div className="space-y-6">
                <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {product.category}
                </p>
                <h2 className="text-xl font-normal leading-snug tracking-[-0.01em] md:text-[2rem] md:leading-[1.1]">
                  {cleanProductTitle(product.name)}
                </h2>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} className={i < Math.floor(product.rating) ? 'fill-foreground text-foreground' : 'text-muted-foreground/35'} />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">({product.reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-semibold tracking-tight">{formatPrice(product.price)}</span>
                  {product.originalPrice && (
                    <>
                      <span className="text-sm text-muted-foreground line-through">{formatPrice(product.originalPrice)}</span>
                      <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-medium text-foreground">{product.discount}% OFF</span>
                    </>
                  )}
                </div>
                <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                  {rewriteToLuxuryDescription(product.description).split('\n\n').map((paragraph, i) => (
                    paragraph.trim() && <p key={i}>{paragraph.trim()}</p>
                  ))}
                </div>

                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((image, index) => (
                      <button
                        key={image}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-16 w-14 flex-shrink-0 overflow-hidden rounded-[0.95rem] border transition-all ${
                          currentImageIndex === index ? 'border-foreground shadow-[0_20px_35px_-24px_hsl(var(--foreground)/0.65)]' : 'border-border opacity-70'
                        }`}
                      >
                        <img src={image} alt={`${product.name} view ${index + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                <div>
                  <h3 className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Color: <span className="text-foreground">{selectedColor || 'Select'}</span></h3>
                  <div className="flex flex-wrap gap-2">
                    {(product.colors || []).map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorChange(color)}
                        className={`rounded-full border px-4 py-2 text-xs font-medium transition-all duration-200 ${
                          selectedColor === color ? 'border-foreground bg-foreground text-background' : 'border-border text-foreground/80 hover:border-foreground/40'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Size: <span className="text-foreground">{selectedSize || 'Select'}</span></h3>
                  <div className="flex flex-wrap gap-2">
                    {(product.sizes || []).map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`flex h-10 min-w-[3rem] items-center justify-center rounded-[0.8rem] border px-3 text-xs font-medium transition-all duration-200 ${
                          selectedSize === size ? 'border-foreground bg-foreground text-background shadow-sm' : 'border-border text-foreground/80 hover:border-foreground/40 hover:bg-muted/30'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Quantity</h3>
                  <div className="inline-flex items-center rounded-full border border-border p-0.5">
                    <button onClick={() => setQuantity(prev => Math.max(1, prev - 1))} className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-muted/50 active:scale-90">
                      <Minus size={13} />
                    </button>
                    <span className="flex w-10 items-center justify-center text-sm font-medium tabular-nums">{quantity}</span>
                    <button onClick={() => setQuantity(prev => prev + 1)} className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-muted/50 active:scale-90">
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 border-t border-border/50 bg-card/95 p-4 backdrop-blur-xl md:p-6">
              <div className="flex items-center gap-3">
                <button onClick={handleAddToCart} className="btn-primary flex flex-1 items-center justify-center gap-2">
                  <ShoppingBag size={16} />
                  Add to Cart
                </button>
                <button
                  onClick={handleWishlistToggle}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border transition-all ${
                    inWishlist ? 'bg-foreground text-background border-foreground' : 'border-border text-foreground/70 hover:border-foreground/40'
                  }`}
                  aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart size={16} className={inWishlist ? 'fill-current' : ''} />
                </button>
              </div>
              <Link
                to={`/product/${product.id}`}
                onClick={onClose}
                className="mt-3 flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
              >
                View Full Details
                <ExternalLink size={12} />
              </Link>
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
