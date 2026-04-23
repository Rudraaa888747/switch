import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/data/products';
import { toast } from '@/hooks/use-toast';
import { getProductImage } from '@/lib/utils';

const Wishlist = () => {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCart = (product: typeof items[0]) => {
    addToCart(product, product.sizes[0], product.colors[0]);
    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleRemove = (productId: string, productName: string) => {
    removeFromWishlist(productId);
    toast({
      title: 'Removed from wishlist',
      description: `${productName} has been removed.`,
    });
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container-custom py-20 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Your Wishlist is Empty</h1>
            <p className="text-muted-foreground mb-8">
              Save your favorite items to your wishlist and they'll appear here.
            </p>
            <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
              Start Shopping
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-custom py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">My Wishlist</h1>
            <p className="text-muted-foreground">
              {items.length} item{items.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <button
            onClick={() => {
              clearWishlist();
              toast({
                title: 'Wishlist cleared',
                description: 'All items have been removed from your wishlist.',
              });
            }}
            className="text-sm text-muted-foreground hover:text-destructive transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} />
            Clear All
          </button>
        </div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="group relative"
            >
              <Link to={`/product/${product.id}`} className="block">
                <div className="relative aspect-product overflow-hidden bg-muted mb-4">
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  
                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemove(product.id, product.name);
                    }}
                    className="absolute top-3 right-3 p-2 bg-background/90 backdrop-blur-sm rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    aria-label="Remove from wishlist"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {product.isNew && (
                      <span className="badge-new">New</span>
                    )}
                    {product.discount && product.discount > 0 && (
                      <span className="badge-sale">-{product.discount}%</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium line-clamp-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatPrice(product.price)}</span>
                    {product.originalPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              {/* Add to Cart Button */}
              <button
                onClick={() => handleAddToCart(product)}
                className="w-full mt-3 py-2 border border-foreground text-foreground text-xs uppercase tracking-widest font-medium flex items-center justify-center gap-2 hover:bg-foreground hover:text-background transition-colors"
              >
                <ShoppingBag size={14} />
                Add to Cart
              </button>
            </motion.div>
          ))}
        </div>

        {/* Continue Shopping */}
        <div className="text-center mt-12">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 btn-outline"
          >
            Continue Shopping
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default Wishlist;
