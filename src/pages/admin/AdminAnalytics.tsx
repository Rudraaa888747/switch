import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Sparkles,
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { products, formatPrice } from '@/data/products';
import { useAdminOverview } from '@/hooks/useAdminOverview';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// Mock analytics data
const revenueData = [
  { month: 'Jan', revenue: 125000, orders: 45 },
  { month: 'Feb', revenue: 148000, orders: 52 },
  { month: 'Mar', revenue: 132000, orders: 48 },
  { month: 'Apr', revenue: 189000, orders: 67 },
  { month: 'May', revenue: 165000, orders: 58 },
  { month: 'Jun', revenue: 212000, orders: 75 },
  { month: 'Jul', revenue: 245000, orders: 89 },
];

const categoryRevenue = [
  { name: 'Shirts', value: 350000 },
  { name: 'Dresses', value: 280000 },
  { name: 'Pants', value: 220000 },
  { name: 'Jackets', value: 180000 },
  { name: 'Accessories', value: 120000 },
];

const AdminAnalytics = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const { data } = useAdminOverview();
  const totalRevenue = data?.totalRevenue ?? 0;
  const orderCount = data?.totalOrders ?? 0;
  const averageOrderValue = useMemo(
    () => formatPrice(totalRevenue / Math.max(orderCount, 1)),
    [orderCount, totalRevenue]
  );

  const bestSellers = products
    .sort((a, b) => b.reviews - a.reviews)
    .slice(0, 5);

  const predictiveInsights = [
    {
      title: 'Revenue Forecast',
      description: 'Expected 18% increase in Q4 based on historical seasonal trends',
      trend: 'up',
      value: '₹3.2L projected',
    },
    {
      title: 'Peak Sales Period',
      description: 'Weekend sales spike expected - prepare inventory',
      trend: 'up',
      value: 'Fri-Sun',
    },
    {
      title: 'Category Growth',
      description: 'Jackets trending 40% above last month average',
      trend: 'up',
      value: '+40%',
    },
    {
      title: 'Stock Warning',
      description: 'Polo shirts likely to sell out in 5 days at current rate',
      trend: 'down',
      value: '5 days',
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold mb-1">Analytics</h1>
            <p className="text-muted-foreground">Sales performance and predictive insights</p>
          </div>
          <div className="flex gap-2">
            {(['week', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            { label: 'Total Revenue', value: formatPrice(totalRevenue || 1250000), icon: DollarSign, change: '+23%', up: true },
            { label: 'Orders', value: orderCount || 156, icon: ShoppingCart, change: '+12%', up: true },
            { label: 'Avg. Order Value', value: averageOrderValue, icon: TrendingUp, change: '+8%', up: true },
            { label: 'Conversion Rate', value: '3.2%', icon: Users, change: '+0.5%', up: true },
          ].map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className={`text-sm font-medium ${metric.up ? 'text-green-500' : 'text-red-500'}`}>
                    {metric.change}
                  </span>
                </div>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-card border border-border rounded-xl p-6"
          >
            <h2 className="text-lg font-semibold mb-4">Monthly Revenue</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [formatPrice(value), 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Category Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-xl p-6"
          >
            <h2 className="text-lg font-semibold mb-4">Revenue by Category</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryRevenue}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryRevenue.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatPrice(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2">
              {categoryRevenue.map((cat, index) => (
                <span key={cat.name} className="text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  {cat.name}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Predictive Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Predictive Analytics</h2>
              <p className="text-sm text-muted-foreground">Insights based on sales patterns</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {predictiveInsights.map((insight, index) => (
              <motion.div
                key={insight.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className={`p-4 rounded-xl border ${
                  insight.trend === 'up'
                    ? 'bg-green-500/5 border-green-500/20'
                    : 'bg-yellow-500/5 border-yellow-500/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{insight.title}</span>
                  {insight.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                <p className="text-xl font-bold mb-1">{insight.value}</p>
                <p className="text-xs text-muted-foreground">{insight.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Best Sellers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Best Selling Products</h2>
          <div className="space-y-4">
            {bestSellers.map((product, index) => (
              <div key={product.id} className="flex items-center gap-4">
                <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">{formatPrice(product.price)}</p>
                  <p className="text-xs text-muted-foreground">{product.reviews} sales</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
