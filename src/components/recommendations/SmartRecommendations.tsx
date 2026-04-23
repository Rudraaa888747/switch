import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { products, Product } from '@/data/products';
import ProductCard from '@/components/products/ProductCard';
import { useAuth } from '@/contexts/AuthContext';

interface SmartRecommendationsProps {
  currentProductId?: string;
  type?: 'personalized' | 'trending' | 'similar';
  limit?: number;
}

const SmartRecommendations = ({ currentProductId, type = 'personalized', limit = 4 }: SmartRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { supabaseUser } = useAuth();

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);

      try {
        let recommendedProducts: Product[] = [];

        if (type === 'trending') {
          // Get products with most views/purchases
          const { data: behaviorData } = await supabase
            .from('user_behavior')
            .select('product_id')
            .in('action_type', ['view', 'purchase', 'cart_add'])
            .order('created_at', { ascending: false })
            .limit(100);

          if (behaviorData && behaviorData.length > 0) {
            // Count occurrences
            const productCounts: Record<string, number> = {};
            behaviorData.forEach(b => {
              productCounts[b.product_id] = (productCounts[b.product_id] || 0) + 1;
            });

            // Sort by count
            const sortedIds = Object.entries(productCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([id]) => id)
              .filter(id => id !== currentProductId);

            recommendedProducts = sortedIds
              .map(id => products.find(p => p.id === id))
              .filter((p): p is Product => !!p)
              .slice(0, limit);
          }
        } else if (type === 'personalized' && supabaseUser?.id) {
          // Get user's viewed/purchased products
          const { data: userBehavior } = await supabase
            .from('user_behavior')
            .select('product_id, action_type')
            .eq('user_id', supabaseUser.id)
            .order('created_at', { ascending: false })
            .limit(20);

          if (userBehavior && userBehavior.length > 0) {
            // Find similar products based on category/occasion
            const viewedProducts = userBehavior
              .map(b => products.find(p => p.id === b.product_id))
              .filter((p): p is Product => !!p);

            const categories = [...new Set(viewedProducts.map(p => p.category))];
            const occasions = [...new Set(viewedProducts.flatMap(p => p.occasion))];
            const viewedIds = new Set(viewedProducts.map(p => p.id));

            recommendedProducts = products
              .filter(p => 
                !viewedIds.has(p.id) && 
                p.id !== currentProductId &&
                (categories.includes(p.category) || p.occasion.some(o => occasions.includes(o)))
              )
              .slice(0, limit);
          }
        } else if (type === 'similar' && currentProductId) {
          // Get similar products by category/occasion
          const currentProduct = products.find(p => p.id === currentProductId);
          if (currentProduct) {
            recommendedProducts = products
              .filter(p => 
                p.id !== currentProductId &&
                (p.category === currentProduct.category || 
                 p.occasion.some(o => currentProduct.occasion.includes(o)))
              )
              .slice(0, limit);
          }
        }

        // Fallback to random products if no recommendations
        if (recommendedProducts.length === 0) {
          recommendedProducts = products
            .filter(p => p.id !== currentProductId)
            .sort(() => Math.random() - 0.5)
            .slice(0, limit);
        }

        setRecommendations(recommendedProducts);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        // Fallback
        setRecommendations(
          products
            .filter(p => p.id !== currentProductId)
            .sort(() => Math.random() - 0.5)
            .slice(0, limit)
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentProductId, type, limit, supabaseUser?.id]);

  const config = {
    personalized: { icon: Heart, title: 'Recommended for You', subtitle: 'Based on your preferences' },
    trending: { icon: TrendingUp, title: 'Trending Now', subtitle: 'Popular picks from our community' },
    similar: { icon: Sparkles, title: 'You May Also Like', subtitle: 'Similar styles you might love' },
  }[type];

  const Icon = config.icon;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
          <div>
            <div className="h-5 bg-muted rounded w-32 mb-2" />
            <div className="h-3 bg-muted rounded w-48" />
          </div>
        </div>
        <div className="grid-product">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-3">
              <div className="aspect-product bg-muted rounded-lg animate-pulse" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{config.title}</h2>
          <p className="text-sm text-muted-foreground">{config.subtitle}</p>
        </div>
      </div>

      <div className="grid-product">
        {recommendations.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </motion.section>
  );
};

export default SmartRecommendations;
