import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Package,
  Filter,
  X,
  Loader2,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  supabaseRestDelete,
  supabaseRestInsert,
  supabaseRestSelect,
  supabaseRestUpdate,
} from '@/integrations/supabase/publicRest';
import { formatPrice } from '@/data/products';
import { normalizeImageUrl } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface ProductData {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  category: string;
  subcategory: string | null;
  stock_quantity: number;
  image_url: string | null;
}

const AdminProducts = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [queryErrorMessage, setQueryErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    original_price: '',
    category: 'men',
    subcategory: '',
    stock_quantity: '',
  });

  // Fetch Products
  const { data: dbProducts = [], isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const params = new URLSearchParams({
        select: '*',
        order: 'created_at.desc',
      });
      const data = await supabaseRestSelect<ProductData[]>('products', params);
      setQueryErrorMessage(null);
      return data;
    },
    onError: (error: Error) => {
      setQueryErrorMessage(error.message || 'Failed to load products from Supabase.');
    },
    retry: 1,
  });

  const filteredProducts = useMemo(() => {
    return dbProducts.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [dbProducts, searchQuery, categoryFilter]);

  // Mutations
  type ProductFormValues = Omit<ProductData, 'id' | 'image_url'> & {
    original_price: number | null;
  };

  const addMutation = useMutation({
    mutationFn: async (newProduct: ProductFormValues) => {
      const data = await supabaseRestInsert<ProductData[]>('products', [{ ...newProduct, id: `prod-${Date.now()}` }]);
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: 'Product Added Successfully' });
      setShowModal(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: 'Error Adding Product', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ProductFormValues> }) => {
      const params = new URLSearchParams({
        id: `eq.${id}`,
      });
      const data = await supabaseRestUpdate<ProductData[]>('products', updates, params);
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: 'Product Updated Successfully' });
      setShowModal(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: 'Error Updating Product', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const params = new URLSearchParams({
        id: `eq.${id}`,
      });
      await supabaseRestDelete('products', params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: 'Product Deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error Deleting Product', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      original_price: '',
      category: 'men',
      subcategory: '',
      stock_quantity: '',
    });
    setSelectedProduct(null);
    setIsEditing(false);
  };

  const handleEditClick = (product: ProductData) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      original_price: (product.original_price || '').toString(),
      category: product.category,
      subcategory: product.subcategory || '',
      stock_quantity: product.stock_quantity.toString(),
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanData = {
      name: formData.name,
      price: parseFloat(formData.price),
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      category: formData.category,
      subcategory: formData.subcategory || null,
      stock_quantity: parseInt(formData.stock_quantity, 10),
    };

    if (isEditing && selectedProduct) {
      updateMutation.mutate({ id: selectedProduct.id, updates: cleanData });
    } else {
      addMutation.mutate(cleanData);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Products</h1>
            <p className="text-muted-foreground">Manage your product inventory in real-time</p>
          </div>
          <motion.button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="btn-primary flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={18} />
            Add Product
          </motion.button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="input-premium pl-11 w-full"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-premium w-full sm:w-48"
          >
            <option value="all">All Categories</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
          </select>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden min-h-[400px]">
          {queryErrorMessage ? (
            <div className="border-b border-destructive/20 bg-destructive/5 px-6 py-4 text-sm text-destructive">
              {queryErrorMessage}
            </div>
          ) : null}
          {isLoading ? (
            <div className="flex h-[400px] flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">Loading products from Supabase...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium">Product</th>
                    <th className="text-left px-6 py-4 text-sm font-medium">Category</th>
                    <th className="text-left px-6 py-4 text-sm font-medium">Price</th>
                    <th className="text-left px-6 py-4 text-sm font-medium">Stock</th>
                    <th className="text-left px-6 py-4 text-sm font-medium">Status</th>
                    <th className="text-right px-6 py-4 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-20 text-muted-foreground italic">
                        No products found. Start by adding one!
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product, index) => {
                      const stock = product.stock_quantity;
                      const stockStatus = stock <= 5 ? 'low' : stock <= 15 ? 'medium' : 'high';
                      
                      return (
                        <motion.tr
                          key={product.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden border">
                                {product.image_url ? (
                                  <img src={normalizeImageUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="text-muted-foreground w-6 h-6" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{product.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">ID: {product.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="capitalize text-sm">{product.category}</span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium text-sm">{formatPrice(product.price)}</p>
                            {product.original_price && (
                              <p className="text-xs text-muted-foreground line-through">
                                {formatPrice(product.original_price)}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-sm">{stock} units</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              stockStatus === 'low' ? 'bg-red-500/10 text-red-500' :
                              stockStatus === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                              'bg-green-500/10 text-green-500'
                            }`}>
                              {stockStatus === 'low' ? 'Low Stock' : stockStatus === 'medium' ? 'Medium' : 'In Stock'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <motion.button
                                onClick={() => handleEditClick(product)}
                                className="p-2 hover:bg-muted rounded-lg transition-colors text-primary"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Edit size={16} />
                              </motion.button>
                              <motion.button
                                onClick={() => { if(window.confirm('Are you sure?')) deleteMutation.mutate(product.id); }}
                                className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                {deleteMutation.isPending && deleteMutation.variables === product.id ? 
                                  <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />
                                }
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6 border-b pb-4">
                  <h2 className="text-xl font-bold">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
                  <button onClick={() => setShowModal(false)} className="hover:bg-muted p-1 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Product Name</label>
                    <input 
                      required
                      type="text" 
                      className="input-premium w-full" 
                      placeholder="e.g. Premium Cotton Shirt"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1.5">Price (₹)</label>
                      <input 
                        required
                        type="number" 
                        className="input-premium w-full" 
                        placeholder="1299"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5">Original Price (₹)</label>
                      <input 
                        type="number" 
                        className="input-premium w-full" 
                        placeholder="1799"
                        value={formData.original_price}
                        onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1.5">Category</label>
                      <select 
                        className="input-premium w-full"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="men">Men</option>
                        <option value="women">Women</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1.5">Stock Quantity</label>
                      <input 
                        required
                        type="number" 
                        className="input-premium w-full" 
                        placeholder="100"
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Subcategory</label>
                    <input 
                      type="text" 
                      className="input-premium w-full" 
                      placeholder="e.g. hoodies, shirts"
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={addMutation.isPending || updateMutation.isPending}
                    className="w-full btn-primary h-12 flex items-center justify-center gap-2 mt-4 text-base font-bold"
                  >
                    {(addMutation.isPending || updateMutation.isPending) ? (
                      <Loader2 className="animate-spin w-5 h-5" />
                    ) : (
                      isEditing ? 'Save Changes' : 'Create Product'
                    )}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
