import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Store, History, LogOut, User, ChevronDown, Package } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { FloatingCart } from '@/components/FloatingCart';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const UserLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuthStore();

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const navItems = [
    { icon: Home, label: 'Beranda', path: '/user' },
    { icon: Store, label: 'Tenant', path: '/user/tenants' },
    { icon: Package, label: 'Pesanan', path: '/user/orders' },
  ];

  return (
    <div className="min-h-screen bg-mesh bg-background pb-20 md:pb-0">
      {/* Top Navbar - Liquid Glass */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="liquid-glass-strong border-b border-white/20 dark:border-white/10 sticky top-0 z-40"
      >
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => navigate('/user')}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img
                src="/logo.png"
                alt="Digibite Logo"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-contain"
              />
            </motion.div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Digibite
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Kantin Digital</p>
            </div>
          </div>

          {/* Desktop Navigation - Center */}
          <div className="hidden md:flex items-center gap-1 liquid-glass rounded-full px-1 py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 rounded-full px-4 transition-all ${isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/10'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />

            {/* Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-1 sm:gap-2 px-2 h-9 rounded-full hover:bg-white/50 dark:hover:bg-white/10">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden ring-2 ring-primary/30 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md"
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.name || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-xs sm:text-sm">
                        {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </motion.div>
                  <span className="hidden md:block text-sm font-medium max-w-[80px] truncate">
                    {profile?.name || 'User'}
                  </span>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 liquid-glass-card border-0">
                <div className="px-3 py-2">
                  <p className="font-medium text-sm">{profile?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{profile?.phone || 'Belum ada no. HP'}</p>
                </div>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem onClick={() => navigate('/user/profile')} className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  Profil Saya
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/user/history')} className="cursor-pointer">
                  <History className="w-4 h-4 mr-2" />
                  Riwayat Pesanan
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Outlet />
      </main>

      {/* Floating Cart */}
      <FloatingCart />

      {/* Bottom Navigation Mobile Only - Liquid Glass */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="md:hidden fixed bottom-0 left-0 right-0 liquid-glass-strong border-t border-white/20 dark:border-white/10 z-40"
      >
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <motion.button
                key={item.path}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition-all ${isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground'
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive && 'drop-shadow-sm'}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </motion.button>
            );
          })}
          {/* Profile in bottom nav */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/user/profile')}
            className={`flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition-all ${location.pathname === '/user/profile'
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground'
              }`}
          >
            <User className={`w-5 h-5 ${location.pathname === '/user/profile' && 'drop-shadow-sm'}`} />
            <span className="text-[10px] font-medium">Profil</span>
          </motion.button>
        </div>
      </motion.nav>
    </div>
  );
};
