import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Download,
  Filter,
  Store,
  CreditCard,
  Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getTenants } from '@/services/tenantService';
import { toast } from 'sonner';

interface Transaction {
  id: string;
  date: string;
  tenant_name: string;
  user_name: string;
  payment_method: string;
  amount: number;
  status: string;
}

export function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch tenants
      const tenantsData = await getTenants();
      setTenants(tenantsData);

      // Fetch orders as transactions
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          payment_method,
          created_at,
          profiles (name),
          tenants (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTransactions = ordersData?.map(order => ({
        id: order.id,
        date: order.created_at,
        tenant_name: (order.tenants as any)?.name || 'N/A',
        user_name: (order.profiles as any)?.name || 'N/A',
        payment_method: order.payment_method || 'cash',
        amount: order.total_amount || 0,
        status: order.status
      })) || [];

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesTenant = selectedTenant === 'all' || t.tenant_name === selectedTenant;
    const matchesPayment = selectedPayment === 'all' || t.payment_method === selectedPayment;
    const transactionDate = t.date.split('T')[0];
    const matchesDate = transactionDate >= dateRange.start && transactionDate <= dateRange.end;
    return matchesTenant && matchesPayment && matchesDate;
  });

  // Calculate stats
  const totalRevenue = filteredTransactions
    .filter(t => ['paid', 'completed'].includes(t.status))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalTransactions = filteredTransactions.length;
  const completedTransactions = filteredTransactions.filter(t => ['paid', 'completed'].includes(t.status)).length;
  const cancelledTransactions = filteredTransactions.filter(t => t.status === 'cancel').length;

  // Generate chart data
  const dailyData = useMemo(() => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const dayStats = Array(7).fill(0).map((_, i) => ({
      name: days[i],
      revenue: 0,
      orders: 0
    }));

    filteredTransactions.forEach(t => {
      if (['paid', 'completed'].includes(t.status)) {
        const dayIndex = new Date(t.date).getDay();
        dayStats[dayIndex].revenue += t.amount;
        dayStats[dayIndex].orders += 1;
      }
    });

    return dayStats;
  }, [filteredTransactions]);

  const paymentMethodData = useMemo(() => {
    const methods: Record<string, number> = { cash: 0, midtrans: 0 };
    filteredTransactions.forEach(t => {
      if (['paid', 'completed'].includes(t.status)) {
        methods[t.payment_method] = (methods[t.payment_method] || 0) + 1;
      }
    });
    return [
      { name: 'Cash', value: methods.cash || 0, color: '#22c55e' },
      { name: 'Midtrans', value: methods.midtrans || 0, color: '#3b82f6' },
    ].filter(m => m.value > 0);
  }, [filteredTransactions]);

  const tenantRevenueData = useMemo(() => {
    const tenantRevenue: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      if (['paid', 'completed'].includes(t.status)) {
        tenantRevenue[t.tenant_name] = (tenantRevenue[t.tenant_name] || 0) + t.amount;
      }
    });
    return Object.entries(tenantRevenue)
      .map(([name, revenue]) => ({
        name: name.length > 15 ? name.slice(0, 15) + '...' : name,
        revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredTransactions]);

  const handleExport = () => {
    const csvContent = filteredTransactions
      .map(t => `${t.date.split('T')[0]},${t.id.slice(0, 8)},${t.tenant_name},${t.user_name},${t.payment_method},${t.amount},${t.status}`)
      .join('\n');

    const blob = new Blob([`Tanggal,Order ID,Tenant,Pelanggan,Pembayaran,Jumlah,Status\n${csvContent}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-${dateRange.start}-to-${dateRange.end}.csv`;
    a.click();
    toast.success('Laporan berhasil diexport');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Memuat data laporan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">Laporan & Analitik</h1>
          <p className="text-muted-foreground">Lihat riwayat transaksi dan analitik pendapatan</p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="w-4 h-4" />
          Export Laporan
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard glow className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Pendapatan</p>
                <p className="text-lg sm:text-2xl font-bold truncate">Rp {totalRevenue.toLocaleString('id-ID')}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-green-500/10 shrink-0">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <GlassCard glow className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Transaksi</p>
                <p className="text-lg sm:text-2xl font-bold">{totalTransactions}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-blue-500/10 shrink-0">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard glow className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Selesai</p>
                <p className="text-lg sm:text-2xl font-bold">{completedTransactions}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-purple-500/10 shrink-0">
                <Store className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <GlassCard glow className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Dibatalkan</p>
                <p className="text-lg sm:text-2xl font-bold">{cancelledTransactions}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-xl bg-red-500/10 shrink-0">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-end gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter:</span>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Mulai</Label>
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-[130px] sm:w-[150px]"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Sampai</Label>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-[130px] sm:w-[150px]"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Tenant</Label>
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger className="w-[150px] sm:w-[180px]">
                <SelectValue placeholder="Semua Tenant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tenant</SelectItem>
                {tenants.map(tenant => (
                  <SelectItem key={tenant.id} value={tenant.name}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Pembayaran</Label>
            <Select value={selectedPayment} onValueChange={setSelectedPayment}>
              <SelectTrigger className="w-[120px] sm:w-[150px]">
                <SelectValue placeholder="Semua" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="midtrans">Midtrans</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue Chart */}
        <GlassCard className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">Pendapatan per Hari</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Payment Method Distribution */}
        {paymentMethodData.length > 0 && (
          <GlassCard className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">Metode Pembayaran</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </GlassCard>
        )}

        {/* Orders Trend */}
        <GlassCard className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">Tren Pesanan</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Revenue by Tenant */}
        {tenantRevenueData.length > 0 && (
          <GlassCard className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">Pendapatan per Tenant</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={tenantRevenueData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={100} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        )}
      </div>

      {/* Transactions Table */}
      <GlassCard className="overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <h3 className="text-base sm:text-lg font-semibold">Riwayat Transaksi</h3>
          <p className="text-sm text-muted-foreground">
            Menampilkan {Math.min(filteredTransactions.length, 10)} dari {filteredTransactions.length} transaksi
          </p>
        </div>
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">Tidak ada transaksi ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead className="hidden sm:table-cell">Tenant</TableHead>
                  <TableHead className="hidden md:table-cell">Pelanggan</TableHead>
                  <TableHead>Pembayaran</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.slice(0, 10).map((transaction, index) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="text-xs sm:text-sm">
                      {new Date(transaction.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </TableCell>
                    <TableCell className="font-mono text-xs">#{transaction.id.slice(0, 8)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{transaction.tenant_name}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{transaction.user_name}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted capitalize">
                        {transaction.payment_method}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold text-sm">
                      Rp {transaction.amount.toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${['paid', 'completed'].includes(transaction.status)
                          ? 'bg-green-500/20 text-green-500'
                          : transaction.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-500'
                            : 'bg-red-500/20 text-red-500'
                        }`}>
                        {transaction.status === 'completed' ? 'Selesai' :
                          transaction.status === 'paid' ? 'Lunas' :
                            transaction.status === 'pending' ? 'Pending' : 'Batal'}
                      </span>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
