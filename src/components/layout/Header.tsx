import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type Easing } from 'framer-motion';
import { 
  Menu, 
  X, 
  ShoppingBag, 
  Search, 
  Sun,
  Moon,
  User,
  ArrowRight,
  Heart
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useSearch } from '@/hooks/useSearch';
import { formatPrice } from '@/data/products';
import { getProductImage } from '@/lib/utils';

// Premium easing curve
const premiumEase: Easing = [0.4, 0, 0.2, 1];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { totalItems: cartItems } = useCart();
  const { totalItems: wishlistItems } = useWishlist();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { query, setQuery, results, isSearching } = useSearch();

  const navLinks = [
    { name: 'New Arrivals', path: '/shop?filter=new' },
    { name: 'Women', path: '/women' },
    { name: 'Men', path: '/men' },
    { name: 'Style Advisor', path: '/style-advisor' },
    { name: 'Sale', path: '/shop?filter=sale' },
  ];

  const secondaryLinks = [
    { name: 'Accessories', path: '/shop?subcategory=accessories' },
    { name: 'AI Assistant', path: '/ai-assistant' },
    { name: 'Admin', path: '/admin/dashboard' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path.split('?')[0]);
  };

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    if (!isSearchOpen) {
      setQuery('');
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
      setIsSearchOpen(false);
      setQuery('');
    }
  };

  const handleProductClick = () => {
    setIsSearchOpen(false);
    setQuery('');
  };

  // Close search on route change
  useEffect(() => {
    setIsSearchOpen(false);
    setQuery('');
  }, [location.pathname, setQuery]);

  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-50 glass"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: premiumEase }}
    >
      <div className="container-custom">
        {/* Top Row - Logo centered, actions on right */}
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile Menu Button */}
          <motion.button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 transition-opacity"
            aria-label="Toggle menu"
            whileHover={{ scale: 1.05, opacity: 1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>

          {/* Spacer for mobile */}
          <div className="md:hidden" />

          {/* Centered Logo */}
          <Link to="/" className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:flex-1 md:flex md:justify-center">
            <motion.span 
              className="text-2xl md:text-3xl font-light tracking-[0.3em] uppercase text-foreground"
              whileHover={{ opacity: 0.7 }}
              transition={{ duration: 0.3 }}
            >
              SWITCH
            </motion.span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-1 md:gap-3">
            {/* User Profile */}
            <motion.div
              whileHover={{ scale: 1.05, opacity: 1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0.8 }}
            >
              <Link
                to={isAuthenticated ? "/profile" : "/auth"}
                className="p-2 inline-block"
                aria-label="Profile"
              >
                <User size={18} />
              </Link>
            </motion.div>

            {/* Wishlist */}
            <motion.div
              whileHover={{ scale: 1.05, opacity: 1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0.8 }}
              className="relative"
            >
              <Link
                to="/wishlist"
                className="p-2 inline-block"
                aria-label="Wishlist"
              >
                <Heart size={18} />
                {wishlistItems > 0 && (
                  <motion.span 
                    className="absolute -top-1 -right-1 w-4 h-4 bg-foreground text-background text-[10px] font-medium flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {wishlistItems}
                  </motion.span>
                )}
              </Link>
            </motion.div>

            {/* Theme Toggle */}
            <motion.button
              onClick={toggleTheme}
              className="p-2"
              aria-label="Toggle theme"
              whileHover={{ scale: 1.05, opacity: 1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0.8 }}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </motion.button>

            {/* Cart */}
            <motion.div
              whileHover={{ scale: 1.05, opacity: 1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0.8 }}
              className="relative"
            >
              <Link
                to={isAuthenticated ? "/cart" : "/auth"}
                className="p-2 inline-block"
                aria-label="Cart"
              >
                <ShoppingBag size={18} />
                {cartItems > 0 && (
                  <motion.span 
                    className="absolute -top-1 -right-1 w-4 h-4 bg-foreground text-background text-[10px] font-medium flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    {cartItems}
                  </motion.span>
                )}
              </Link>
            </motion.div>

            {/* Search */}
            <motion.button
              onClick={handleSearchToggle}
              className="p-2"
              aria-label="Search"
              whileHover={{ scale: 1.05, opacity: 1 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0.8 }}
            >
              <Search size={18} />
            </motion.button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center justify-center gap-10 pb-4">
          {navLinks.map((link, index) => (
            <motion.div
              key={link.name}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05, duration: 0.4, ease: premiumEase }}
            >
              <Link
                to={link.path}
                className={`nav-link ${isActive(link.path) ? 'nav-link-active' : ''}`}
              >
                {link.name}
              </Link>
            </motion.div>
          ))}
        </nav>

        {/* Search Bar with Live Results */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: premiumEase }}
              className="overflow-hidden border-t border-border"
            >
              <div className="py-4">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search products, categories, colors..."
                      className="input-premium text-sm pl-11 pr-4"
                      autoFocus
                    />
                    {query && (
                      <motion.button
                        type="button"
                        onClick={() => setQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1"
                        whileHover={{ opacity: 0.6 }}
                      >
                        <X size={16} />
                      </motion.button>
                    )}
                  </div>
                </form>

                {/* Live Search Results */}
                <AnimatePresence>
                  {isSearching && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: premiumEase }}
                      className="mt-4 max-h-[60vh] overflow-y-auto"
                    >
                      {results.length > 0 ? (
                        <>
                          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
                            {results.length} result{results.length !== 1 ? 's' : ''} found
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {results.slice(0, 8).map((product, index) => (
                              <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.3 }}
                              >
                                <Link
                                  to={`/product/${product.id}`}
                                  onClick={handleProductClick}
                                  className="group block bg-card border border-border hover:border-foreground/30 transition-all duration-300 hover:shadow-md"
                                >
                                  <div className="aspect-square overflow-hidden">
                                    <img
                                      src={getProductImage(product)}
                                      alt={product.name}
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                  </div>
                                  <div className="p-3">
                                    <h4 className="text-xs font-medium line-clamp-1">{product.name}</h4>
                                    <p className="text-xs text-muted-foreground capitalize">{product.category}</p>
                                    <p className="text-sm font-medium mt-1">{formatPrice(product.price)}</p>
                                  </div>
                                </Link>
                              </motion.div>
                            ))}
                          </div>
                          {results.length > 8 && (
                            <motion.button
                              onClick={handleSearchSubmit}
                              className="w-full mt-4 py-3 text-center text-sm font-medium hover:bg-muted transition-colors duration-300 flex items-center justify-center gap-2 group"
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                            >
                              View all {results.length} results
                              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                            </motion.button>
                          )}
                        </>
                      ) : (
                        <motion.div 
                          className="text-center py-8"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <p className="text-muted-foreground">No products found for "{query}"</p>
                          <p className="text-xs text-muted-foreground mt-1">Try searching for colors, categories, or occasions</p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: premiumEase }}
            className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border"
          >
            <nav className="container-custom py-8 flex flex-col gap-6">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                >
                  <Link
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`text-sm uppercase tracking-widest font-medium transition-opacity duration-300 ${
                      isActive(link.path) 
                        ? 'opacity-100' 
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              <motion.div 
                className="border-t border-border pt-6 mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">More</p>
                {secondaryLinks.map((link, index) => (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + index * 0.05, duration: 0.3 }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block py-2 text-sm uppercase tracking-widest font-medium transition-opacity duration-300 ${
                        isActive(link.path) 
                          ? 'opacity-100' 
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
