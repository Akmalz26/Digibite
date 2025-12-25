import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  Phone,
  CreditCard,
  Banknote,
  Filter,
  ChevronDown,
  MessageCircle
} from 'lucide-react';
import { getSellerOrders, updateOrderStatus, getSellerOrderStats } from '@/services/orderService';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Menunggu', color: 'text-yellow-500 bg-yellow-500/10', icon: Clock },
  paid: { label: 'Dibayar', color: 'text-blue-500 bg-blue-500/10', icon: CreditCard },
  completed: { label: 'Selesai', color: 'text-green-500 bg-green-500/10', icon: CheckCircle },
  cancel: { label: 'Dibatalkan', color: 'text-red-500 bg-red-500/10', icon: XCircle },
};

export function SellerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({ pending: 0, paid: 0, completed: 0, total_revenue: 0 });
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const [ordersData, statsData] = await Promise.all([
        getSellerOrders(statusFilter),
        getSellerOrderStats(),
      ]);
      setOrders(ordersData);
      setStats(statsData);
    } catch (error: any) {
      toast.error('Gagal memuat pesanan');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      await updateOrderStatus(orderId, newStatus as any);
      toast.success(`Status pesanan berhasil diperbarui ke ${statusConfig[newStatus]?.label}`);
      fetchOrders();
    } catch (error: any) {
      toast.error('Gagal memperbarui status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredOrders = orders.filter(order =>
    order.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.midtrans_order_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openWhatsApp = (phone: string, orderName: string) => {
    // Remove non-numeric characters and ensure it starts with country code
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('62')) {
      cleanPhone = '62' + cleanPhone;
    }

    const message = encodeURIComponent(
      `Halo! Saya dari Digibite ingin menghubungi Anda terkait pesanan "${orderName}".`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Memuat pesanan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient mb-2">Pesanan</h1>
        <p className="text-muted-foreground">Kelola pesanan dari pelanggan</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Menunggu</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dibayar</p>
              <p className="text-2xl font-bold">{stats.paid}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Selesai</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Pendapatan</p>
              <p className="text-lg font-bold">Rp {stats.total_revenue.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau ID pesanan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[150px]">
              <Filter className="w-4 h-4 mr-2" />
              {statusFilter === 'all' ? 'Semua Status' : statusConfig[statusFilter]?.label}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>
              Semua Status
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
              <Clock className="w-4 h-4 mr-2 text-yellow-500" />
              Menunggu Pembayaran
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('paid')}>
              <CreditCard className="w-4 h-4 mr-2 text-blue-500" />
              Sudah Dibayar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              Selesai
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('cancel')}>
              <XCircle className="w-4 h-4 mr-2 text-red-500" />
              Dibatalkan
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Tidak ada pesanan</h3>
          <p className="text-muted-foreground">
            {statusFilter === 'all'
              ? 'Belum ada pesanan masuk'
              : `Tidak ada pesanan dengan status "${statusConfig[statusFilter]?.label}"`}
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order, index) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard className="p-4">
                  {/* Header: Status & Date */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                      {order.payment_method === 'cash' && (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-500 flex items-center gap-1">
                          <Banknote className="w-3 h-3" />
                          Cash
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(order.created_at)}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{order.user_name}</p>
                        {order.user_phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {order.user_phone}
                          </p>
                        )}
                      </div>
                    </div>
                    {order.user_phone && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-green-500 border-green-500/30 hover:bg-green-500/10"
                        onClick={() => openWhatsApp(order.user_phone, order.midtrans_order_id)}
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        WhatsApp
                      </Button>
                    )}
                  </div>

                  {/* Order Items */}
                  <div className="glass p-3 rounded-lg mb-3">
                    <p className="text-xs text-muted-foreground mb-1">Item Pesanan:</p>
                    <div className="text-sm space-y-1">
                      {order.order_items?.slice(0, 3).map((item: any, idx: number) => (
                        <div key={item.id} className="flex justify-between">
                          <span>{item.products?.name} x{item.quantity}</span>
                          <span className="text-muted-foreground">
                            Rp {item.subtotal?.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                      {order.order_items?.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{order.order_items.length - 3} item lainnya
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {order.notes && (
                    <div className="glass p-2 rounded-lg mb-3 text-sm">
                      <span className="text-muted-foreground">📝 </span>
                      {order.notes}
                    </div>
                  )}

                  {/* Total & Actions */}
                  <div className="flex flex-col gap-3 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Pembayaran</span>
                      <span className="text-xl font-bold text-primary">
                        Rp {order.total_amount?.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {order.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            className="flex-1 bg-green-500 hover:bg-green-600"
                            onClick={() => handleUpdateStatus(order.id, order.payment_method === 'cash' ? 'completed' : 'paid')}
                            disabled={updatingStatus === order.id}
                          >
                            {updatingStatus === order.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Konfirmasi
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                            onClick={() => handleUpdateStatus(order.id, 'cancel')}
                            disabled={updatingStatus === order.id}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}

                      {order.status === 'paid' && (
                        <Button
                          size="sm"
                          className="flex-1 bg-green-500 hover:bg-green-600"
                          onClick={() => handleUpdateStatus(order.id, 'completed')}
                          disabled={updatingStatus === order.id}
                        >
                          {updatingStatus === order.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Selesaikan
                            </>
                          )}
                        </Button>
                      )}

                      {order.status === 'completed' && (
                        <div className="flex-1 text-center py-2 text-sm text-green-500 font-medium">
                          ✓ Pesanan Selesai
                        </div>
                      )}

                      {order.status === 'cancel' && (
                        <div className="flex-1 text-center py-2 text-sm text-red-500 font-medium">
                          ✕ Dibatalkan
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDetailDialog(true);
                        }}
                      >
                        Detail
                      </Button>
                    </div>
                  </div>

                  {/* Order ID */}
                  <div className="text-xs text-muted-foreground mt-2 text-center">
                    {order.midtrans_order_id}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Pesanan</DialogTitle>
            <DialogDescription>
              {selectedOrder?.midtrans_order_id}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="glass p-4 rounded-xl">
                <h4 className="font-semibold mb-2">Pelanggan</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Nama:</span> {selectedOrder.user_name}</p>
                  <p><span className="text-muted-foreground">Telepon:</span> {selectedOrder.user_phone || '-'}</p>
                </div>
                {selectedOrder.user_phone && (
                  <Button
                    className="w-full mt-3 bg-green-500 hover:bg-green-600"
                    size="sm"
                    onClick={() => openWhatsApp(selectedOrder.user_phone, selectedOrder.midtrans_order_id)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat via WhatsApp
                  </Button>
                )}
              </div>

              {/* Order Items */}
              <div className="glass p-4 rounded-xl">
                <h4 className="font-semibold mb-2">Item Pesanan</h4>
                <div className="space-y-2">
                  {selectedOrder.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.products?.name} x{item.quantity}</span>
                      <span>Rp {item.subtotal?.toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                  <div className="border-t border-white/10 pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-primary">Rp {selectedOrder.total_amount?.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="glass p-4 rounded-xl">
                  <h4 className="font-semibold mb-2">Catatan</h4>
                  <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Status Info */}
              <div className="glass p-4 rounded-xl">
                <h4 className="font-semibold mb-2">Status</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Status:</span> {statusConfig[selectedOrder.status]?.label}</p>
                  <p><span className="text-muted-foreground">Metode:</span> {selectedOrder.payment_method === 'cash' ? 'Tunai' : 'Digital'}</p>
                  <p><span className="text-muted-foreground">Dibuat:</span> {formatDate(selectedOrder.created_at)}</p>
                  {selectedOrder.paid_at && (
                    <p><span className="text-muted-foreground">Dibayar:</span> {formatDate(selectedOrder.paid_at)}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
