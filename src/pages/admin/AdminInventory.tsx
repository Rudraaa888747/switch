import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Search,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { products, formatPrice } from '@/data/products';
import { normalizeImageUrl } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Mock inventory data
const inventoryData = products.map((product, index) => ({
  ...product,
  stock: [45, 12, 8, 30, 5, 22, 35, 18, 3, 28, 15, 10][index % 12],
  trend: ['up', 'down', 'stable', 'up', 'down', 'up', 'stable', 'up', 'down', 'stable', 'up', 'down'][index % 12] as 'up' | 'down' | 'stable',
  demandLevel: ['high', 'medium', 'low', 'high', 'low', 'medium', 'high', 'medium', 'low', 'medium', 'high', 'medium'][index % 12] as 'high' | 'medium' | 'low',
}));

const stockChartData = [
  { name: 'Shirts', inStock: 120, lowStock: 15 },
  { name: 'Pants', inStock: 85, lowStock: 8 },
  { name: 'Dresses', inStock: 95, lowStock: 12 },
  { name: 'Jackets', inStock: 45, lowStock: 5 },
  { name: 'Accessories', inStock: 200, lowStock: 20 },
];

const AdminInventory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<string>('all');

  const lowStockItems = inventoryData.filter(item => item.stock <= 10);
  const outOfStockItems = inventoryData.filter(item => item.stock <= 3);
  const healthyStockItems = inventoryData.filter(item => item.stock > 20);

  const filteredInventory = inventoryData.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      stockFilter === 'all' ||
      (stockFilter === 'low' && item.stock <= 10) ||
      (stockFilter === 'out' && item.stock <= 3) ||
      (stockFilter === 'healthy' && item.stock > 20);
    return matchesSearch && matchesFilter;
  });

  const getStockStatus = (stock: number) => {
    if (stock <= 3) return { label: 'Critical', color: 'bg-red-500/10 text-red-500' };
    if (stock <= 10) return { label: 'Low Stock', color: 'bg-yellow-500/10 text-yellow-500' };
    return { label: 'In Stock', color: 'bg-green-500/10 text-green-500' };
  };

  const getDemandBadge = (demand: 'high' | 'medium' | 'low') => {
    switch (demand) {
      case 'high': return 'bg-primary/10 text-primary';
      case 'medium': return 'bg-blue-500/10 text-blue-500';
      case 'low': return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold mb-1">Inventory</h1>
          <p className="text-muted-foreground">Monitor stock levels and demand patterns</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total Products</span>
            </div>
            <p className="text-2xl font-bold">{products.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Healthy Stock</span>
            </div>
            <p className="text-2xl font-bold text-green-500">{healthyStockItems.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Low Stock</span>
            </div>
            <p className="text-2xl font-bold text-yellow-500">{lowStockItems.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <span className="text-sm text-muted-foreground">Critical</span>
            </div>
            <p className="text-2xl font-bold text-red-500">{outOfStockItems.length}</p>
          </div>
        </motion.div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Stock Distribution by Category</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stockChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="inStock" fill="hsl(var(--primary))" name="In Stock" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lowStock" fill="#ef4444" name="Low Stock" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
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
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="input-premium w-full sm:w-48"
          >
            <option value="all">All Stock Levels</option>
            <option value="healthy">Healthy (20+)</option>
            <option value="low">Low Stock (≤10)</option>
            <option value="out">Critical (≤3)</option>
          </select>
        </motion.div>

        {/* Inventory Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium">Product</th>
                  <th className="text-left px-6 py-4 text-sm font-medium">Stock</th>
                  <th className="text-left px-6 py-4 text-sm font-medium">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium">Demand</th>
                  <th className="text-left px-6 py-4 text-sm font-medium">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInventory.map((item, index) => {
                  const status = getStockStatus(item.stock);
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={normalizeImageUrl(item.variants?.[0]?.images?.[0] || item.image || '')}
                            alt={item.name}
                            className="w-10 h-12 object-cover rounded-lg"
                          />
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-sm">{item.stock} units</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getDemandBadge(item.demandLevel)}`}>
                          {item.demandLevel} Demand
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {item.trend === 'up' ? (
                          <span className="flex items-center gap-1 text-green-500 text-sm">
                            <ArrowUp size={14} /> Rising
                          </span>
                        ) : item.trend === 'down' ? (
                          <span className="flex items-center gap-1 text-red-500 text-sm">
                            <ArrowDown size={14} /> Falling
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Stable</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminInventory;
