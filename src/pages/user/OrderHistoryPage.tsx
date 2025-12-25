import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, Loader2, RefreshCw, CheckCircle, CreditCard, Banknote, XCircle } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { getOrderHistory, cancelOrder, resumePayment } from '@/services/orderService';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

// Declare Midtrans Snap types
declare global {
  interface Window {
    snap: {
      pay: (token: string, options: {
        onSuccess?: (result: any) => void;
        onPending?: (result: any) => void;
        onError?: (result: any) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

const statusConfig: Record<string, { label: string; color: string; icon: any; bgColor: string }> = {
  pending: {
    label: 'Menunggu Pembayaran',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    icon: Clock
  },
  paid: {
    label: 'Sudah Dibayar',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    icon: CreditCard
  },
  processing: {
    label: 'Sedang Diproses',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    icon: Package
  },
  ready: {
    label: 'Siap Diambil',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    icon: Package
  },
  delivered: {
    label: 'Sedang Diantar',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    icon: Package
  },
  completed: {
    label: 'Selesai',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    icon: CheckCircle
  },
  cancel: {
    label: 'Dibatalkan',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    icon: XCircle
  },
};

// Order flow steps for animation
const orderFlowSteps = [
  { key: 'pending', label: 'Belum Dibayar' },
  { key: 'paid', label: 'Dibayar' },
  { key: 'processing', label: 'Di Proses' },
  { key: 'completed', label: 'Selesai' },
];

const getStepIndex = (status: string): number => {
  if (status === 'pending') return 0;
  if (status === 'paid') return 1;
  if (status === 'processing' || status === 'ready' || status === 'delivered') return 2;
  if (status === 'completed') return 3;
  return -1; // cancelled
};

export const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [resumingPayment, setResumingPayment] = useState<string | null>(null);
  const { profile } = useAuthStore();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrderHistory();
      setOrders(data);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error('Gagal memuat riwayat pesanan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Subscribe to realtime changes for all orders
    const channel = supabase
      .channel('user-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('Order update received:', payload);
          // Update the specific order in state
          setOrders(prevOrders =>
            prevOrders.map(order =>
              order.id === payload.new.id
                ? { ...order, ...payload.new }
                : order
            )
          );

          // Show toast notification for status change
          const newStatus = payload.new.status;
          const oldStatus = payload.old?.status;
          if (newStatus !== oldStatus) {
            const statusInfo = statusConfig[newStatus];
            if (statusInfo) {
              if (newStatus === 'paid') {
                toast.success('Pembayaran dikonfirmasi oleh penjual!');
              } else if (newStatus === 'completed') {
                toast.success('Pesanan selesai!');
              } else if (newStatus === 'cancel') {
                toast.error('Pesanan dibatalkan');
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        () => {
          // Refetch all orders when new order is added
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    try {
      setCancelling(orderId);
      await cancelOrder(orderId);
      toast.success('Pesanan dibatalkan');
      fetchOrders();
    } catch (error: any) {
      toast.error('Gagal membatalkan pesanan');
    } finally {
      setCancelling(null);
    }
  };

  const handleResumPayment = async (orderId: string) => {
    setResumingPayment(orderId);
    try {
      const { snap_token } = await resumePayment(orderId);

      if (snap_token && window.snap) {
        window.snap.pay(snap_token, {
          onSuccess: () => {
            toast.success('Pembayaran berhasil!');
            fetchOrders();
          },
          onPending: () => {
            toast.info('Pembayaran pending. Silakan selesaikan pembayaran.');
          },
          onError: () => {
            toast.error('Pembayaran gagal');
          },
          onClose: () => {
            toast.info('Pembayaran belum selesai');
          },
        });
      } else {
        toast.error('Tidak dapat melanjutkan pembayaran');
      }
    } catch (error: any) {
      toast.error('Gagal melanjutkan pembayaran');
    } finally {
      setResumingPayment(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Memuat riwayat pesanan...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong rounded-full w-32 h-32 flex items-center justify-center mb-6"
        >
          <Package className="w-16 h-16 text-muted-foreground" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">Belum Ada Pesanan</h2>
        <p className="text-muted-foreground mb-6">
          Riwayat pesanan Anda akan muncul di sini
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Riwayat Pesanan</h1>
          <p className="text-muted-foreground">Lihat semua pesanan Anda</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          className="glass"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {orders.map((order, idx) => {
          const status = statusConfig[order.status] || statusConfig.pending;
          const StatusIcon = status.icon;

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <GlassCard>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-bold text-lg">
                        {order.tenants?.name || 'Tenant'}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${status.color} ${status.bgColor}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                      {order.payment_method === 'cash' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-500">
                          <Banknote className="w-3 h-3" />
                          Cash
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {formatDate(order.created_at)}
                    </div>
                    {order.midtrans_order_id && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Order ID: {order.midtrans_order_id}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">Total</div>
                    <div className="text-xl font-bold text-primary">
                      Rp {order.total_amount?.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>

                {order.notes && (
                  <div className="glass p-3 rounded-lg mb-4">
                    <p className="text-sm text-muted-foreground">📝 {order.notes}</p>
                  </div>
                )}

                {/* Flow Progress Animation - Only for non-cancelled orders */}
                {order.status !== 'cancel' && order.status !== 'pending' && (
                  <div className="mb-4 p-4 glass rounded-xl">
                    <div className="flex items-center justify-between relative">
                      {/* Progress Line Background */}
                      <div className="absolute top-4 left-8 right-8 h-1 bg-muted rounded-full" />

                      {/* Active Progress Line */}
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(getStepIndex(order.status) / (orderFlowSteps.length - 1)) * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="absolute top-4 left-8 h-1 bg-gradient-to-r from-primary to-green-500 rounded-full"
                        style={{ maxWidth: 'calc(100% - 4rem)' }}
                      />

                      {orderFlowSteps.map((step, index) => {
                        const isActive = getStepIndex(order.status) >= index;
                        const isCurrent = getStepIndex(order.status) === index;

                        return (
                          <div key={step.key} className="flex flex-col items-center z-10">
                            <motion.div
                              initial={{ scale: 0.8 }}
                              animate={{
                                scale: isCurrent ? [1, 1.1, 1] : 1,
                              }}
                              transition={{
                                repeat: isCurrent ? Infinity : 0,
                                duration: 1.5
                              }}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isActive
                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                : 'bg-muted text-muted-foreground'
                                }`}
                            >
                              {isActive ? '✓' : index + 1}
                            </motion.div>
                            <span className={`text-xs mt-2 font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'
                              }`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}


                <div className="flex gap-3 pt-4 border-t border-white/10">
                  {order.status === 'pending' && (
                    <>
                      {order.payment_method === 'midtrans' && (
                        <Button
                          className="flex-1 gradient-primary"
                          onClick={() => handleResumPayment(order.id)}
                          disabled={resumingPayment === order.id}
                        >
                          {resumingPayment === order.id ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <CreditCard className="w-4 h-4 mr-2" />
                          )}
                          Bayar Sekarang
                        </Button>
                      )}
                      {order.payment_method === 'cash' && (
                        <div className="flex-1 text-center py-2 text-sm text-yellow-500 font-medium">
                          ⏳ Menunggu konfirmasi penjual
                        </div>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancelling === order.id}
                      >
                        {cancelling === order.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </Button>
                    </>
                  )}
                  {(order.status === 'paid' || order.status === 'processing' || order.status === 'ready' || order.status === 'delivered') && (
                    <Button
                      className="flex-1 gradient-primary"
                      onClick={() => navigate(`/user/order/${order.id}`)}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Detail Pesanan
                    </Button>
                  )}
                  {order.status === 'completed' && (
                    <div className="flex-1 text-center py-2 text-sm text-green-500 font-medium">
                      ✓ Pesanan selesai
                    </div>
                  )}
                  {order.status === 'cancel' && (
                    <div className="flex-1 text-center py-2 text-sm text-red-500 font-medium">
                      ✕ Pesanan dibatalkan
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
