import { useState, useMemo, useCallback } from 'react';
import { products, Product } from '@/data/products';

export const useSearch = () => {
  const [query, setQuery] = useState('');

  const searchProducts = useCallback((searchQuery: string): Product[] => {
    if (!searchQuery.trim()) return [];
    
    const normalizedQuery = searchQuery.toLowerCase().trim();
    const queryWords = normalizedQuery.split(/\s+/);

    return products
      .map(product => {
        let score = 0;
        const searchableText = [
          product.name,
          product.description,
          product.category,
          product.subcategory,
          ...product.colors,
          ...product.occasion,
          product.fabric,
        ].join(' ').toLowerCase();

        // Exact name match gets highest score
        if (product.name.toLowerCase().includes(normalizedQuery)) {
          score += 10;
        }

        // Category match
        if (product.category.toLowerCase().includes(normalizedQuery)) {
          score += 5;
        }

        // Check each word
        queryWords.forEach(word => {
          if (searchableText.includes(word)) {
            score += 2;
          }
        });

        // Color match
        if (product.colors.some(c => c.toLowerCase().includes(normalizedQuery))) {
          score += 3;
        }

        // Occasion match
        if (product.occasion.some(o => o.toLowerCase().includes(normalizedQuery))) {
          score += 3;
        }

        return { product, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.product);
  }, []);

  const results = useMemo(() => searchProducts(query), [query, searchProducts]);

  return {
    query,
    setQuery,
    results,
    searchProducts,
    hasResults: results.length > 0,
    isSearching: query.trim().length > 0,
  };
};

export default useSearch;
