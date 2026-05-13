import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Product } from '@/data/products';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface WishlistContextType {
  items: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  totalItems: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
const LOCAL_KEY = 'switch-wishlist';

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, session } = useAuth();
  const [items, setItems] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      localStorage.removeItem(LOCAL_KEY);
      return [];
    }
  });
  const [synced, setSynced] = useState(false);

  // Load from Supabase on auth
  useEffect(() => {
    if (!isAuthenticated || !user || synced) return;
    
    const loadServer = async () => {
      try {
        const { data: serverItems } = await supabase
          .from('wishlist_items')
          .select('product_id')
          .eq('user_id', user.id);
        
        if (serverItems && serverItems.length > 0) {
          // We only have product_ids - mark them for resolution
          const local = items;
          const serverIds = new Set(serverItems.map(si => si.product_id));
          
          // Merge: keep local items that also exist on server
          const merged = local.filter(li => serverIds.has(li.id));
          // If server has more than local, we can't resolve products without querying
          // Fallback: keep local as-is since we loaded products from localStorage
          if (merged.length !== local.length && merged.length > 0) {
            setItems(merged);
          }
        }
        setSynced(true);
      } catch {
        setSynced(true);
      }
    };
    
    loadServer();
  }, [isAuthenticated, user, synced]);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
  }, [items]);

  // Sync to Supabase when items change
  useEffect(() => {
    if (!isAuthenticated || !user || !synced) return;
    
    const syncToServer = async () => {
      try {
        await supabase.from('wishlist_items').delete().eq('user_id', user.id);
        
        if (items.length > 0) {
          const rows = items.map(product => ({
            user_id: user.id,
            product_id: product.id,
          }));
          await supabase.from('wishlist_items').upsert(rows, { onConflict: 'user_id,product_id' });
        }
      } catch {
        // Table may not exist yet
      }
    };
    
    syncToServer();
  }, [items, isAuthenticated, user, session, synced]);

  const addToWishlist = useCallback((product: Product) => {
    setItems(prev => {
      if (prev.find(item => item.id === product.id)) return prev;
      return [...prev, product];
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => item.id !== productId));
  }, []);

  const toggleWishlist = useCallback((product: Product) => {
    setItems(prev => {
      if (prev.find(item => item.id === product.id)) {
        return prev.filter(item => item.id !== product.id);
      }
      return [...prev, product];
    });
  }, []);

  const isInWishlist = useCallback((productId: string) => {
    return items.some(item => item.id === productId);
  }, [items]);

  const clearWishlist = useCallback(() => {
    setItems([]);
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
        totalItems: items.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
