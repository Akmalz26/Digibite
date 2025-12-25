import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  DollarSign,
  Store,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const navItems = [
  { path: '/seller', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/seller/products', label: 'Produk', icon: Package },
  { path: '/seller/orders', label: 'Pesanan', icon: ShoppingBag },
  { path: '/seller/revenue', label: 'Pendapatan', icon: DollarSign },
  { path: '/seller/store', label: 'Pengaturan Toko', icon: Store },
  { path: '/seller/settings', label: 'Pengaturan', icon: Settings },
];

export function SellerLayout() {
  const location = useLocation();
  const { signOut, profile } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    signOut();
    toast.success('Logout berhasil');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50 dark:bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-card border-b border-gray-200 dark:border-white/10 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Digibite Logo" className="w-8 h-8 rounded-lg object-contain" />
          <span className="font-bold text-lg text-primary">Digibite Seller</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Desktop Sidebar - Always visible on lg+ */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-card border-r border-gray-200 dark:border-white/10 flex-col shrink-0">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 p-6 border-b border-gray-200 dark:border-white/10">
            <img src="/logo.png" alt="Digibite Logo" className="w-10 h-10 rounded-lg object-contain" />
            <div>
              <span className="font-bold text-lg text-primary">Digibite</span>
              <p className="text-xs text-muted-foreground">Seller Panel</p>
            </div>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <span className="text-white font-bold">
                  {profile?.name?.charAt(0)?.toUpperCase() || 'S'}
                </span>
              </div>
              <div>
                <p className="font-medium text-sm">{profile?.name || 'Seller'}</p>
                <p className="text-xs text-muted-foreground">Akun Seller</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link key={item.path} to={item.path}>
                  <div
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-all duration-200
                      ${isActive
                        ? 'bg-primary text-white shadow-md'
                        : 'hover:bg-gray-100 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200 dark:border-white/10">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Keluar
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-card border-r border-gray-200 dark:border-white/10 z-50 lg:hidden flex flex-col"
            >
              <div className="flex flex-col h-full">
                {/* Logo */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Digibite Logo" className="w-8 h-8 rounded-lg object-contain" />
                    <span className="font-bold text-primary">Digibite Seller</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* User Info */}
                <div className="p-4 border-b border-gray-200 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-white font-bold">
                        {profile?.name?.charAt(0)?.toUpperCase() || 'S'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{profile?.name || 'Seller'}</p>
                      <p className="text-xs text-muted-foreground">Akun Seller</p>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <div
                          className={`
                            flex items-center gap-3 px-4 py-3 rounded-lg
                            transition-all duration-200
                            ${isActive
                              ? 'bg-primary text-white'
                              : 'hover:bg-gray-100 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground'
                            }
                          `}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-gray-200 dark:border-white/10">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Keluar
                  </Button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
