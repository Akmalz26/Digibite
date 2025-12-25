import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Star, Clock, Loader2, Sparkles, Coffee, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/GlassCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getTenants } from '@/services/tenantService';
import { getProducts, searchProducts } from '@/services/productService';
import type { Tenant, Product } from '@/types/database';
import { useAuthStore } from '@/store/authStore';

const categories = [
  { name: 'Semua', icon: '🍽️', value: '' },
  { name: 'Makanan Berat', icon: '🍜', value: 'Makanan Berat' },
  { name: 'Makanan Ringan', icon: '🍔', value: 'Makanan Ringan' },
  { name: 'Minuman', icon: '🥤', value: 'Minuman' },
  { name: 'Snack', icon: '🍿', value: 'Snack' },
  { name: 'Dessert', icon: '🍰', value: 'Dessert' },
];

export const UserHomePage = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return { text: 'Selamat Pagi', emoji: '☀️' };
    if (hour < 15) return { text: 'Selamat Siang', emoji: '🌤️' };
    if (hour < 18) return { text: 'Selamat Sore', emoji: '🌅' };
    return { text: 'Selamat Malam', emoji: '🌙' };
  };

  const greeting = getGreeting();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tenantsData, productsData] = await Promise.all([
          getTenants(),
          getProducts(),
        ]);
        setTenants(tenantsData);
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const results = await searchProducts(query);
        setProducts(results);
      } catch (error) {
        console.error('Search error:', error);
      }
    } else {
      const productsData = await getProducts();
      setProducts(productsData);
    }
  };

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory)
    : products;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Coffee className="w-12 h-12 text-primary mb-4" />
        </motion.div>
        <p className="text-muted-foreground">Menyiapkan menu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section - Modern Liquid Glass */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl"
      >
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700">
          {/* Floating Orbs */}
          <motion.div
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-cyan-400/40 to-transparent rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -20, 0],
              y: [0, 30, 0],
              scale: [1.1, 1, 1.1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/30 to-transparent rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-white/10 to-transparent rounded-full"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 sm:p-8 md:p-10">
          {/* Greeting with Glass Effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 mb-4"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-white/90 text-sm font-medium">
              {greeting.text} {greeting.emoji}
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2"
          >
            Hai, {profile?.name?.split(' ')[0] || 'Foodie'}! 👋
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white/80 text-base sm:text-lg mb-6 max-w-lg"
          >
            Mau pesan apa hari ini? Temukan makanan favorit dari kantin Digitech University
          </motion.p>

          {/* Search Bar - Liquid Glass */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-xl"
          >
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-white/50 to-white/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <div className="relative bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 p-1">
                <div className="relative flex items-center">
                  <Search className="absolute left-4 w-5 h-5 text-white/70" />
                  <Input
                    placeholder="Cari makanan atau minuman..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-12 h-12 sm:h-14 bg-transparent border-0 text-white placeholder:text-white/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Button
                    size="sm"
                    className="absolute right-2 bg-white text-blue-600 hover:bg-white/90 rounded-xl px-4 shadow-lg"
                  >
                    <span className="hidden sm:inline mr-2">Cari</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex gap-4 mt-6"
          >
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span>{tenants.length} Tenant Aktif</span>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <Coffee className="w-4 h-4" />
              <span>{products.length}+ Menu</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Categories - Horizontal Scroll */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Kategori</h2>
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3">
          {categories.map((cat, idx) => (
            <motion.button
              key={cat.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(cat.value)}
              className={`liquid-glass-card px-4 sm:px-5 py-3 rounded-2xl flex-shrink-0 flex flex-col items-center min-w-[80px] transition-all ${selectedCategory === cat.value
                  ? 'ring-2 ring-primary bg-primary/5 shadow-lg shadow-primary/20'
                  : ''
                }`}
            >
              <span className="text-2xl mb-1">{cat.icon}</span>
              <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{cat.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Popular Tenants */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Tenant Populer
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/user/tenants')}
            className="text-primary hover:text-primary"
          >
            Lihat Semua
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        {tenants.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-muted-foreground">Belum ada tenant tersedia</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {tenants.slice(0, 4).map((tenant, idx) => (
              <motion.div
                key={tenant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <GlassCard
                  className="cursor-pointer overflow-hidden p-0"
                  onClick={() => navigate(`/user/tenant/${tenant.id}`)}
                >
                  <div className="relative h-32 sm:h-40 overflow-hidden">
                    <img
                      src={tenant.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'}
                      alt={tenant.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-3 right-3 liquid-glass px-2 py-1 rounded-lg flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-bold text-white">{tenant.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="font-bold text-sm sm:text-base mb-1">{tenant.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-1">
                      {tenant.description || tenant.category || 'Tenant'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>15-20 menit</span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Products */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {selectedCategory ? `Menu ${selectedCategory}` : 'Rekomendasi Untukmu'}
          </h2>
        </div>
        {filteredProducts.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-muted-foreground">Belum ada produk tersedia</p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.slice(0, 8).map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <GlassCard
                  className="cursor-pointer overflow-hidden p-0 group"
                  onClick={() => navigate(`/user/tenant/${product.tenant_id}`)}
                >
                  <div className="relative h-28 sm:h-36 overflow-hidden">
                    <img
                      src={product.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                      {product.category || 'Menu'}
                    </p>
                    <div className="font-bold text-primary text-sm sm:text-base">
                      Rp {product.price.toLocaleString('id-ID')}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
