import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/GlassCard';
import {
  DollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { StatusBadge } from '@/components/StatusBadge';
import { getSellerStats, getSellerOrders } from '@/services/adminService';
import { getMyProducts } from '@/services/productService';
import type { Order, Product } from '@/types/database';

export function SellerDashboard() {
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    paidOrders: 0,
    totalRevenue: 0,
    balance: 0,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<(Order & { user_name: string })[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, productsData, ordersData] = await Promise.all([
          getSellerStats(),
          getMyProducts(),
          getSellerOrders(),
        ]);
        setStats(statsData);
        setProducts(productsData);
        setRecentOrders(ordersData.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Map database status
  const mapStatus = (status: string) => {
    switch (status) {
      case 'pending': return 'pending';
      case 'paid': return 'processing';
      case 'cancel': return 'cancelled';
      default: return 'pending';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Memuat dashboard...</p>
      </div>
    );
  }

  const dashboardStats = [
    {
      label: 'Saldo Tenant',
      value: `Rp ${stats.balance.toLocaleString('id-ID')}`,
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    {
      label: 'Total Produk',
      value: products.length,
      icon: Package,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      label: 'Total Pesanan',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
    },
    {
      label: 'Total Revenue',
      value: `Rp ${stats.totalRevenue.toLocaleString('id-ID')}`,
      icon: TrendingUp,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang kembali, {profile?.name}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dashboardStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Order Status Summary */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold mb-4">Ringkasan Status Pesanan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-400/10">
            <Clock className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{stats.pendingOrders}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-400/10">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-2xl font-bold">{stats.paidOrders}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10">
            <DollarSign className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Saldo</p>
              <p className="text-2xl font-bold">Rp {stats.balance.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Recent Orders */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-bold mb-4">Pesanan Terbaru</h2>
        {recentOrders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Belum ada pesanan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <motion.div
                key={order.id}
                whileHover={{ x: 4 }}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-smooth"
              >
                <div className="flex-1">
                  <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.user_name} • Rp {order.total_amount.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(order.created_at).toLocaleString('id-ID')}
                  </p>
                </div>
                <StatusBadge status={mapStatus(order.status)} />
              </motion.div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
