import { useQuery } from '@tanstack/react-query';
import { supabaseRestSelect } from '@/integrations/supabase/publicRest';
import { Product } from '@/data/products';
import { DbProduct, mapDbProductToProduct } from './useProducts';

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    staleTime: 30_000,
    queryFn: async () => {
      if (!id) return null;

      const params = new URLSearchParams({
        id: `eq.${id}`,
        limit: '1',
      });

      const data = await supabaseRestSelect<DbProduct[]>('products', params);

      if (!data || data.length === 0) return null;

      const dbProduct = data[0];
      return mapDbProductToProduct(dbProduct);
    },
    enabled: !!id,
  });
};
