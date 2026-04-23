import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Star,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  Filter,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabaseRestDelete, supabaseRestSelect } from '@/integrations/supabase/publicRest';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface Review {
  id: string;
  product_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  sentiment: string | null;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
}

interface ProductLite {
  id: string;
  name: string;
}

interface AdminReviewsApiResponse {
  data?: {
    reviews?: Review[];
    products?: ProductLite[];
  };
  error?: string;
}

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const parseApiResponse = async (response: Response): Promise<AdminReviewsApiResponse> => {
    const responseText = await response.text();
    if (!responseText) return {};

    try {
      return JSON.parse(responseText) as AdminReviewsApiResponse;
    } catch {
      return { error: responseText };
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      let fetchedReviews: Review[] = [];
      let fetchedProducts: ProductLite[] = [];

      try {
        const response = await fetch('/api/admin/reviews', {
          method: 'GET',
          headers: {
            'x-admin-token': import.meta.env.VITE_ADMIN_API_TOKEN || 'demo123',
          },
        });

        const result = await parseApiResponse(response);
        if (!response.ok) {
          throw new Error(result?.error || `Failed to load reviews (HTTP ${response.status})`);
        }

        fetchedReviews = result.data?.reviews || [];
        fetchedProducts = result.data?.products || [];
      } catch {
        fetchedReviews = await supabaseRestSelect<Review[]>(
          'reviews',
          new URLSearchParams({
            select: '*',
            order: 'created_at.desc',
          })
        );

        fetchedProducts = await supabaseRestSelect<ProductLite[]>(
          'products',
          new URLSearchParams({
            select: 'id,name',
          })
        );
      }

      setReviews(fetchedReviews || []);

      const nameMap: Record<string, string> = {};
      (fetchedProducts || []).forEach((p) => {
        nameMap[p.id] = p.name;
      });
      setProductNames(nameMap);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reviews data.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const deleteReview = async (reviewId: string) => {
    try {
      try {
        const response = await fetch(`/api/admin/reviews?id=${encodeURIComponent(reviewId)}`, {
          method: 'DELETE',
          headers: {
            'x-admin-token': import.meta.env.VITE_ADMIN_API_TOKEN || 'demo123',
          },
        });

        const result = await parseApiResponse(response);
        if (!response.ok) {
          throw new Error(result?.error || `Failed to delete review (HTTP ${response.status})`);
        }
      } catch {
        await supabaseRestDelete('reviews', new URLSearchParams({ id: `eq.${reviewId}` }));
      }
      
      setReviews(reviews.filter(r => r.id !== reviewId));
      toast({
        title: 'Review Deleted',
        description: 'The review has been removed successfully.',
      });
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete review.',
        variant: 'destructive',
      });
    }
  };

  const getProductName = (productId: string) => {
    return productNames[productId] || productId;
  };

  const getSentimentIcon = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'negative': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch = 
      review.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getProductName(review.product_id).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSentiment = sentimentFilter === 'all' || review.sentiment === sentimentFilter;
    return matchesSearch && matchesSentiment;
  });

  const stats = {
    total: reviews.length,
    positive: reviews.filter(r => r.sentiment === 'positive').length,
    neutral: reviews.filter(r => r.sentiment === 'neutral').length,
    negative: reviews.filter(r => r.sentiment === 'negative').length,
    avgRating: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0',
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold mb-1">Reviews</h1>
          <p className="text-muted-foreground">Manage and moderate customer reviews</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-5 gap-4"
        >
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Reviews</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-2xl font-bold flex items-center gap-1">
              <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
              {stats.avgRating}
            </p>
            <p className="text-sm text-muted-foreground">Avg. Rating</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-2xl font-bold text-green-500">{stats.positive}</p>
            <p className="text-sm text-muted-foreground">Positive</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-2xl font-bold text-gray-500">{stats.neutral}</p>
            <p className="text-sm text-muted-foreground">Neutral</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-2xl font-bold text-red-500">{stats.negative}</p>
            <p className="text-sm text-muted-foreground">Negative</p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reviews..."
              className="input-premium pl-11 w-full"
            />
          </div>
          <select
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
            className="input-premium w-full sm:w-48"
          >
            <option value="all">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
        </motion.div>

        {/* Reviews List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-muted rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No reviews found
            </div>
          ) : (
            filteredReviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted'
                            }`}
                          />
                        ))}
                      </div>
                      {getSentimentIcon(review.sentiment)}
                      {review.is_verified_purchase && (
                        <span className="flex items-center gap-1 text-xs text-primary">
                          <CheckCircle size={12} /> Verified
                        </span>
                      )}
                    </div>
                    
                    <p className="font-medium text-sm mb-1">
                      {getProductName(review.product_id)}
                    </p>
                    
                    {review.title && (
                      <h4 className="font-medium mb-1">{review.title}</h4>
                    )}
                    
                    {review.content && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{review.content}</p>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                      {' · '}{review.helpful_count} found helpful
                    </p>
                  </div>
                  
                  <motion.button
                    onClick={() => deleteReview(review.id)}
                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 size={18} />
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;
