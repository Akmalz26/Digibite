import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { getAllOrders, updateOrderStatus } from '@/services/adminService';
import { supabase } from '@/lib/supabase';
import {
  Search,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Package,
  Filter,
  ShoppingBag,
  User,
  Store,
  CreditCard,
  Calendar
} from 'lucide-react';

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-500/20 text-amber-500', icon: Clock },
  { value: 'paid', label: 'Dibayar', color: 'bg-blue-500/20 text-blue-500', icon: CreditCard },
  { value: 'processing', label: 'Diproses', color: 'bg-purple-500/20 text-purple-500', icon: Package },
  { value: 'completed', label: 'Selesai', color: 'bg-green-500/20 text-green-500', icon: CheckCircle },
  { value: 'cancel', label: 'Dibatalkan', color: 'bg-red-500/20 text-red-500', icon: XCircle },
];

interface AdminOrder {
  id: string;
  user_id: string;
  tenant_id: string;
  total_amount: number;
  status: string;
  payment_method: string;
  notes: string | null;
  created_at: string;
  user_name: string;
  tenant_name: string;
}

export function AdminOrders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getAllOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Gagal memuat data pesanan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.tenant_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus as any);
      setOrders(orders.map(order =>
        order.id === orderId
          ? { ...order, status: newStatus }
          : order
      ));
      toast.success(`Status pesanan diubah ke ${newStatus}`);
    } catch (error) {
      toast.error('Gagal mengubah status');
    }
  };

  const handleViewDetail = async (order: AdminOrder) => {
    setSelectedOrder(order);
    try {
      const { data } = await supabase
        .from('order_items')
        .select(`
          *,
          products (name, image_url, price)
        `)
        .eq('order_id', order.id);
      setOrderItems(data || []);
    } catch (error) {
      console.error('Error fetching order items:', error);
    }
    setDetailDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    if (!statusOption) return null;
    const Icon = statusOption.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusOption.color}`}>
        <Icon className="w-3 h-3" />
        {statusOption.label}
      </span>
    );
  };

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    paid: orders.filter(o => o.status === 'paid').length,
    completed: orders.filter(o => o.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Memuat data pesanan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">Manajemen Pesanan</h1>
        <p className="text-muted-foreground">Kelola dan pantau semua pesanan</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <GlassCard className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
              <p className="text-xl sm:text-2xl font-bold">{orderStats.total}</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
              <p className="text-xl sm:text-2xl font-bold">{orderStats.pending}</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <CreditCard className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Dibayar</p>
              <p className="text-xl sm:text-2xl font-bold">{orderStats.paid}</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Selesai</p>
              <p className="text-xl sm:text-2xl font-bold">{orderStats.completed}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan ID, pelanggan, atau tenant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {statusOptions.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      {/* Orders Table */}
      <GlassCard className="overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-muted-foreground">Tidak ada pesanan ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead className="hidden sm:table-cell">Pelanggan</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Tanggal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order, index) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-mono text-xs sm:text-sm">#{order.id.slice(0, 8)}</TableCell>
                    <TableCell className="hidden sm:table-cell">{order.user_name || 'N/A'}</TableCell>
                    <TableCell>{order.tenant_name || 'N/A'}</TableCell>
                    <TableCell className="font-semibold text-sm">Rp {order.total_amount?.toLocaleString('id-ID')}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                      {new Date(order.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetail(order)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value)}
                        >
                          <SelectTrigger className="w-[110px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(status => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>

      {/* Order Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Detail Pesanan</DialogTitle>
            <DialogDescription>
              Order #{selectedOrder?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info Grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="glass p-3 sm:p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <User className="w-4 h-4" />
                    <span className="text-xs sm:text-sm">Pelanggan</span>
                  </div>
                  <p className="font-medium text-sm sm:text-base">{selectedOrder.user_name}</p>
                </div>
                <div className="glass p-3 sm:p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Store className="w-4 h-4" />
                    <span className="text-xs sm:text-sm">Tenant</span>
                  </div>
                  <p className="font-medium text-sm sm:text-base">{selectedOrder.tenant_name}</p>
                </div>
                <div className="glass p-3 sm:p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <CreditCard className="w-4 h-4" />
                    <span className="text-xs sm:text-sm">Pembayaran</span>
                  </div>
                  <p className="font-medium text-sm sm:text-base capitalize">{selectedOrder.payment_method}</p>
                </div>
                <div className="glass p-3 sm:p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs sm:text-sm">Tanggal</span>
                  </div>
                  <p className="font-medium text-sm sm:text-base">
                    {new Date(selectedOrder.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold mb-3">Item Pesanan</h4>
                <div className="space-y-2">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 sm:gap-4 glass p-3 rounded-xl">
                      <img
                        src={(item.products as any)?.image_url || 'https://via.placeholder.com/64'}
                        alt={(item.products as any)?.name}
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">{(item.products as any)?.name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Rp {item.price_at_time?.toLocaleString('id-ID')} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-sm sm:text-base">
                        Rp {item.subtotal?.toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="glass p-4 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-1">Catatan</p>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}

              {/* Total & Status */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl sm:text-2xl font-bold text-primary">
                    Rp {selectedOrder.total_amount?.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
