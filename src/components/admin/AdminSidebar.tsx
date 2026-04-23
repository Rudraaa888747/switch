import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  MessageSquare,
  BarChart3,
  TrendingUp,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Undo2,
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: Package, label: 'Products', path: '/admin/products' },
  { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
  { icon: Undo2, label: 'Returns', path: '/admin/returns' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: MessageSquare, label: 'Reviews', path: '/admin/reviews' },
  { icon: BarChart3, label: 'Inventory', path: '/admin/inventory' },
  { icon: TrendingUp, label: 'Analytics', path: '/admin/analytics' },
];

const AdminSidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    window.location.href = '/';
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`bg-card border-r border-border h-screen sticky top-0 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h1 className="text-xl font-bold">SWITCH</h1>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </motion.div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={20} />
                {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-2">
        {!collapsed && (
          <div className="px-3 py-2">
            <p className="text-sm font-medium truncate">Admin</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={20} />
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default AdminSidebar;
