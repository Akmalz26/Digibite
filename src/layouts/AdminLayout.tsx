import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  LayoutDashboard,
  Store,
  Package,
  Users,
  CreditCard,
  FileText,
  LogOut,
  Menu,
  X,
  Wallet,
  ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/tenants', label: 'Tenants', icon: Store },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/withdrawals', label: 'Withdrawals', icon: Wallet },
  { to: '/admin/reports', label: 'Reports', icon: FileText },
];

export function AdminLayout() {
  const { profile, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const isActive = (path: string, end?: boolean) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex w-full bg-gray-50 dark:bg-background">
      {/* Desktop Sidebar - Always visible on lg+ */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-card border-r border-gray-200 dark:border-white/10 flex-col shrink-0">
        <div className="p-6 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Digibite Logo" className="w-10 h-10 rounded-xl object-contain" />
            <div>
              <h2 className="font-bold text-lg text-primary">Digibite</h2>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.to, item.end);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${active
                  ? 'bg-primary text-white shadow-md'
                  : 'text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/5 hover:text-foreground'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-bold">
                {profile?.name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{profile?.name || 'Admin'}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
            <ThemeToggle />
          </div>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-500/10"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-card border-r border-gray-200 dark:border-white/10 z-50 lg:hidden flex flex-col"
            >
              <div className="p-4 border-b border-gray-200 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Digibite Logo" className="w-10 h-10 rounded-xl object-contain" />
                    <div>
                      <h2 className="font-bold text-lg text-primary">Digibite</h2>
                      <p className="text-xs text-muted-foreground">Admin Panel</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const active = isActive(item.to, item.end);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${active
                        ? 'bg-primary text-white'
                        : 'text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/5 hover:text-foreground'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-3 mb-4 px-2">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white font-bold">
                      {profile?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{profile?.name || 'Admin'}</p>
                    <p className="text-xs text-muted-foreground">Administrator</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-red-500"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white dark:bg-card border-b border-gray-200 dark:border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Digibite Logo" className="w-8 h-8 rounded-lg object-contain" />
            <span className="font-bold text-primary">Digibite Admin</span>
          </div>
          <ThemeToggle />
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
