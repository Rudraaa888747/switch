import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Product, products } from '@/data/products';

const SYSTEM_PROMPT = `You are a fashion expert who helps create perfect outfit combinations. Given a selected product and a list of available products, identify the best matching items based on:
1. Color harmony (complementary, analogous, or neutral pairings)
2. Occasion compatibility
3. Style cohesion
4. Variety (different subcategories for a complete look)

Return a JSON array of product IDs that best match the selected item, ordered by match quality. Include 4-6 items maximum.

Respond ONLY with a JSON object in this format:
{
  "matchingIds": ["id1", "id2", "id3"],
  "reasoning": "Brief explanation of why these items work together"
}`;

export const useOutfitMatching = () => {
  const [isMatching, setIsMatching] = useState(false);

  const getAIMatches = async (selectedProduct: Product): Promise<Product[]> => {
    setIsMatching(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/outfit-matching`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            selectedProduct,
            allProducts: products,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get outfit matches');
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      // Map IDs back to products
      const matchingProducts = result.matchingIds
        .map((id: string) => products.find(p => p.id === id))
        .filter((p: Product | undefined): p is Product => p !== undefined);

      return matchingProducts.length > 0 ? matchingProducts : getFallbackMatches(selectedProduct);
    } catch (error) {
      console.error('Outfit matching error:', error);
      return getFallbackMatches(selectedProduct);
    } finally {
      setIsMatching(false);
    }
  };

  // Fallback matching logic (original color harmony rules)
  const getFallbackMatches = (selectedProduct: Product): Product[] => {
    const colorHarmony: Record<string, string[]> = {
      'Black': ['White', 'Grey', 'Navy', 'Red', 'Pink', 'Cream', 'Beige'],
      'White': ['Black', 'Navy', 'Blue', 'Pink', 'Grey', 'Beige', 'Floral'],
      'Navy': ['White', 'Cream', 'Light Blue', 'Pink', 'Grey', 'Beige'],
      'Grey': ['Black', 'White', 'Navy', 'Pink', 'Blue', 'Red'],
      'Blue': ['White', 'Grey', 'Navy', 'Light Blue', 'Beige', 'Pink'],
      'Pink': ['White', 'Grey', 'Navy', 'Black', 'Cream', 'Lavender'],
      'Olive': ['White', 'Cream', 'Black', 'Navy', 'Beige', 'Grey'],
      'Red': ['Black', 'White', 'Navy', 'Grey', 'Cream'],
      'Lavender': ['White', 'Pink', 'Grey', 'Cream', 'Black'],
      'Cream': ['Navy', 'Black', 'Olive', 'Brown', 'Grey', 'Blue'],
      'Beige': ['Navy', 'White', 'Black', 'Grey', 'Brown', 'Olive'],
    };

    const productColors = selectedProduct.colors;
    const harmoniousColors: string[] = [];
    
    productColors.forEach(color => {
      const baseColor = Object.keys(colorHarmony).find(key => 
        color.toLowerCase().includes(key.toLowerCase())
      );
      if (baseColor && colorHarmony[baseColor]) {
        harmoniousColors.push(...colorHarmony[baseColor]);
      }
    });

    return products
      .filter(p => p.id !== selectedProduct.id)
      .filter(p => {
        const hasMatchingColor = p.colors.some(color => 
          harmoniousColors.some(hc => color.toLowerCase().includes(hc.toLowerCase()))
        );
        const hasMatchingOccasion = p.occasion.some(o => 
          selectedProduct.occasion.includes(o)
        );
        const differentSubcategory = p.subcategory !== selectedProduct.subcategory;
        return (hasMatchingColor || hasMatchingOccasion) && differentSubcategory;
      })
      .slice(0, 6);
  };

  return { getAIMatches, isMatching };
};
