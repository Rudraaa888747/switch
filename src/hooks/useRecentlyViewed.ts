import { useState, useEffect, useCallback } from 'react';
import type { Product } from '@/data/products';

const STORAGE_KEY = 'recently_viewed';
const MAX_ITEMS = 8;

export const useRecentlyViewed = () => {
  const [ids, setIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids]);

  // Stable identity + bail-out when nothing changed, so consumers can safely
  // depend on this in effects without causing render loops.
  const addProduct = useCallback((product: Product) => {
    setIds(prev => {
      const next = [product.id, ...prev.filter(id => id !== product.id)].slice(0, MAX_ITEMS);
      if (prev.length === next.length && prev.every((id, index) => id === next[index])) {
        return prev; // No change — keep the same reference to avoid re-renders
      }
      return next;
    });
  }, []);

  const getProducts = useCallback((allProducts: Product[]): Product[] => {
    if (!allProducts || allProducts.length === 0) return [];
    return ids
      .map(id => allProducts.find(p => p.id === id))
      .filter((p): p is Product => p !== undefined);
  }, [ids]);

  return { addProduct, getProducts, ids };
};
