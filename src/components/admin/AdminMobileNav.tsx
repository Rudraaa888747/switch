import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Package, ShoppingCart, Users, BarChart3, LogOut } from 'lucide-react';
import { useAdmin } from '@/contexts/AdminContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Home', path: '/admin/dashboard' },
  { icon: Package, label: 'Products', path: '/admin/products' },
  { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
];

const AdminMobileNav = () => {
  const location = useLocation();
  const { adminLogout, unreadCount } = useAdmin();

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleLogout = () => {
    adminLogout();
    window.location.href = '/';
  };

  return (
    <nav className="fixed left-0 right-0 z-50 px-3 safe-bottom md:hidden" style={{ bottom: '0.65rem' }}>
      <div className="mobile-glass-panel mx-auto flex max-w-[24.5rem] items-center justify-between gap-1 rounded-[2rem] px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link key={item.label} to={item.path} className="relative flex-1">
              <motion.div whileTap={{ scale: 0.94 }} className={`relative flex min-h-[3.45rem] items-center justify-center rounded-[1.2rem] ${active ? 'text-foreground' : 'text-muted-foreground/72'}`}>
                {active && (
                  <motion.div
                    layoutId="admin-mobile-active"
                    className="absolute inset-0 rounded-[1.2rem] bg-foreground/[0.08]"
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  />
                )}
                <div className="relative flex items-center gap-2">
                  <div className="relative">
                    <Icon size={active ? 19 : 18} />
                    {item.label === 'Orders' && unreadCount > 0 && <span className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-destructive" />}
                  </div>
                  {active && <span className="text-[10px] uppercase tracking-[0.2em]">{item.label}</span>}
                </div>
              </motion.div>
            </Link>
          );
        })}

        <button onClick={handleLogout} className="flex min-h-[3.45rem] flex-1 items-center justify-center rounded-[1.2rem] text-muted-foreground/72">
          <div className="flex items-center gap-2">
            <LogOut size={18} />
            <span className="text-[10px] uppercase tracking-[0.2em]">Exit</span>
          </div>
        </button>
      </div>
    </nav>
  );
};

export default AdminMobileNav;
