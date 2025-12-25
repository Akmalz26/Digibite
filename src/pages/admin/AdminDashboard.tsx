import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/GlassCard';
import {
  Store,
  Package,
  Users,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Loader2,
  Wallet
} from 'lucide-react';
import { getAdminStats, getAllOrders, getAdminBalance } from '@/services/adminService';
import { toast } from 'sonner';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalTenants: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    paidOrders: 0,
  });
  const [adminBalance, setAdminBalance] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, ordersData, balanceData] = await Promise.all([
          getAdminStats(),
          getAllOrders(),
          getAdminBalance()
        ]);
        setStats(statsData);
        setRecentOrders(ordersData.slice(0, 5));
        setAdminBalance(balanceData);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast.error('Gagal memuat data dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    {
      label: 'Total Tenant',
      value: stats.totalTenants,
      icon: Store,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Total Pengguna',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      label: 'Total Pesanan',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      label: 'Total Pendapatan',
      value: `Rp ${stats.totalRevenue.toLocaleString('id-ID')}`,
      icon: DollarSign,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    {
      label: 'Pesanan Pending',
      value: stats.pendingOrders,
      icon: TrendingUp,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10'
    },
    {
      label: 'Pesanan Lunas',
      value: stats.paidOrders,
      icon: Package,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10'
    },
    {
      label: 'Saldo Admin (Biaya Layanan)',
      value: `Rp ${adminBalance.toLocaleString('id-ID')}`,
      icon: Wallet,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-500';
      case 'paid': return 'bg-blue-500/20 text-blue-500';
      case 'processing': return 'bg-purple-500/20 text-purple-500';
      case 'pending': return 'bg-amber-500/20 text-amber-500';
      case 'cancel': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Selesai';
      case 'paid': return 'Lunas';
      case 'processing': return 'Diproses';
      case 'pending': return 'Pending';
      case 'cancel': return 'Dibatalkan';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">Dashboard Admin</h1>
        <p className="text-muted-foreground">Selamat datang! Berikut ringkasan data hari ini.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <GlassCard glow className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1 truncate">{stat.label}</p>
                  <p className="text-lg sm:text-2xl font-bold truncate">{stat.value}</p>
                </div>
                <div className={`p-2 sm:p-3 rounded-xl ${stat.bgColor} shrink-0`}>
                  <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Pesanan Terbaru</h2>
        <GlassCard className="overflow-hidden">
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">Belum ada pesanan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border/50">
                  <tr>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground">Order ID</th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground hidden sm:table-cell">Pelanggan</th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground">Tenant</th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground">Total</th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 sm:p-4 font-mono text-xs sm:text-sm">#{order.id.slice(0, 8)}</td>
                      <td className="p-3 sm:p-4 text-sm hidden sm:table-cell">{order.user_name || 'N/A'}</td>
                      <td className="p-3 sm:p-4 text-sm">{order.tenant_name || 'N/A'}</td>
                      <td className="p-3 sm:p-4 font-semibold text-sm">Rp {order.total_amount?.toLocaleString('id-ID')}</td>
                      <td className="p-3 sm:p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
