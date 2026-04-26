import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/data/products';
import { getProductImage } from '@/lib/utils';

const Cart = () => {
  const { items, updateQuantity, removeFromCart, totalPrice, totalItems } = useCart();
  const { isAuthenticated, isAuthReady } = useAuth();

  if (isAuthReady && !isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container-custom py-20 text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-12 h-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Looks like you haven't added anything yet.</p>
          <Link to="/shop" className="btn-primary">Start Shopping</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-custom py-8 md:py-12">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart ({totalItems})</h1>
        
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={`${item.product.id}-${item.size}-${item.color}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4 p-4 bg-card rounded-2xl border border-border"
              >
                <Link to={`/product/${item.product.id}`} className="w-24 h-32 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={getProductImage(item.product, item.color)} alt={item.product.name} className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1">
                  <Link to={`/product/${item.product.id}`} className="font-medium hover:text-primary">{item.product.name}</Link>
                  <p className="text-sm text-muted-foreground mt-1">Size: {item.size} • Color: {item.color}</p>
                  <p className="font-semibold mt-2">{formatPrice(item.product.price)}</p>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-border rounded-lg">
                      <button onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity - 1)} className="p-2"><Minus size={16} /></button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity + 1)} className="p-2"><Plus size={16} /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id, item.size, item.color)} className="p-2 text-destructive hover:bg-destructive/10 rounded-full"><Trash2 size={18} /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-2xl p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPrice(totalPrice)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-green-600">Free</span></div>
                <div className="border-t border-border pt-3 flex justify-between text-lg font-semibold">
                  <span>Total</span><span>{formatPrice(totalPrice)}</span>
                </div>
              </div>
              <Link to="/checkout" className="w-full btn-primary mt-6 flex items-center justify-center gap-2">
                Checkout <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
