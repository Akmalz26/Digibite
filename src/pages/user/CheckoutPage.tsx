import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Banknote, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import {
  checkoutOrder,
  subscribeToOrderStatus,
  getPendingOrder,
  resumePayment,
  changePaymentMethod
} from '@/services/orderService';
import { toast } from 'sonner';

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

type PaymentMethod = 'midtrans' | 'cash';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { profile } = useAuthStore();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('midtrans');
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [checkingPending, setCheckingPending] = useState(true);

  // Get tenant ID from first item
  const tenantId = items[0]?.product.tenant_id || items[0]?.product.tenantId;

  // Check for pending orders
  useEffect(() => {
    const checkPendingOrder = async () => {
      if (!tenantId) {
        setCheckingPending(false);
        return;
      }

      try {
        const pending = await getPendingOrder(tenantId);
        if (pending && pending.snap_token) {
          setPendingOrder(pending);
        }
      } catch (error) {
        console.error('Error checking pending order:', error);
      } finally {
        setCheckingPending(false);
      }
    };

    checkPendingOrder();
  }, [tenantId]);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && !pendingOrder) {
      navigate('/user/cart');
    }
  }, [items.length, navigate, pendingOrder]);

  // Subscribe to order status changes
  useEffect(() => {
    if (!currentOrderId) return;

    const unsubscribe = subscribeToOrderStatus(currentOrderId, (order) => {
      if (order.status === 'paid' || order.status === 'completed') {
        setPaymentStatus('success');
        setShowSuccessDialog(true);
      } else if (order.status === 'cancel') {
        setPaymentStatus('error');
        toast.error('Pembayaran dibatalkan');
      }
    });

    return () => unsubscribe();
  }, [currentOrderId]);

  if (checkingPending) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Memeriksa pesanan...</p>
      </div>
    );
  }

  if (items.length === 0 && !pendingOrder) {
    return null;
  }

  // Resume pending payment
  const handleResumePendingPayment = async () => {
    if (!pendingOrder) return;

    setLoading(true);
    try {
      const { order, snap_token } = await resumePayment(pendingOrder.id);
      setCurrentOrderId(order.id);

      if (snap_token && window.snap) {
        window.snap.pay(snap_token, {
          onSuccess: () => {
            setPaymentStatus('success');
            setShowSuccessDialog(true);
          },
          onPending: () => {
            toast.info('Pembayaran pending. Silakan selesaikan pembayaran.');
            setLoading(false);
          },
          onError: () => {
            toast.error('Pembayaran gagal. Silakan coba lagi.');
            setLoading(false);
          },
          onClose: () => {
            toast.info('Pembayaran belum selesai');
            setLoading(false);
          },
        });
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal melanjutkan pembayaran');
      setLoading(false);
    }
  };

  // Change payment method for pending order
  const handleChangePaymentMethod = async (method: PaymentMethod) => {
    if (pendingOrder) {
      try {
        await changePaymentMethod(pendingOrder.id, method);
        setPendingOrder({ ...pendingOrder, payment_method: method, snap_token: null });
        setPaymentMethod(method);
        toast.success('Metode pembayaran berhasil diubah');
      } catch (error: any) {
        toast.error('Gagal mengubah metode pembayaran');
      }
    } else {
      setPaymentMethod(method);
    }
  };

  const handleCheckout = async () => {
    if (!profile) {
      toast.error('Silakan login terlebih dahulu');
      navigate('/login');
      return;
    }

    // If there's a pending order, ask user to complete it first
    if (pendingOrder && pendingOrder.payment_method === 'midtrans' && pendingOrder.snap_token) {
      toast.info('Anda memiliki pesanan yang belum dibayar. Lanjutkan pembayaran?');
      handleResumePendingPayment();
      return;
    }

    if (!tenantId) {
      toast.error('Data produk tidak valid');
      return;
    }

    setLoading(true);
    setPaymentStatus('processing');

    try {
      // Calculate service fee for admin
      const serviceFee = 2000;

      const { order, snap_token } = await checkoutOrder({
        tenant_id: tenantId,
        items: items.map(item => ({
          product_id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        })),
        notes,
        payment_method: paymentMethod,
        service_fee: serviceFee,
      });

      setCurrentOrderId(order.id);

      if (paymentMethod === 'cash') {
        // Cash payment - no Midtrans popup
        toast.success('Pesanan berhasil dibuat! Silakan bayar tunai ke penjual.');
        clearCart();
        navigate('/user/history');
        return;
      }

      // Midtrans payment
      if (snap_token && window.snap) {
        clearCart();
        window.snap.pay(snap_token, {
          onSuccess: (result) => {
            console.log('Payment success:', result);
            setPaymentStatus('success');
            setShowSuccessDialog(true);
          },
          onPending: (result) => {
            console.log('Payment pending:', result);
            toast.info('Pembayaran pending. Silakan selesaikan pembayaran.');
            setPaymentStatus('idle');
            setLoading(false);
          },
          onError: (result) => {
            console.error('Payment error:', result);
            toast.error('Pembayaran gagal. Silakan coba lagi.');
            setPaymentStatus('error');
            setLoading(false);
          },
          onClose: () => {
            console.log('Snap closed');
            if (paymentStatus !== 'success') {
              toast.info('Pembayaran belum selesai. Anda dapat melanjutkan nanti.');
              setPaymentStatus('idle');
              setLoading(false);
            }
          },
        });
      } else if (!snap_token) {
        // Order created but no snap token
        toast.success('Pesanan berhasil dibuat!');
        clearCart();
        navigate('/user/history');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Gagal memproses pesanan');
      setPaymentStatus('error');
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    clearCart();
    setShowSuccessDialog(false);
    toast.success('Pesanan berhasil dibuat!');
    navigate('/user/history');
  };

  const subtotal = getTotalPrice();
  const SERVICE_FEE = 2000; // Biaya layanan Rp 2.000 masuk ke admin
  const total = subtotal + SERVICE_FEE;

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold mb-2">Checkout</h1>
        <p className="text-muted-foreground">Selesaikan pesanan Anda</p>
      </div>

      {/* Pending Order Warning */}
      {pendingOrder && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="border-yellow-500/30 bg-yellow-500/10">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-500">Pesanan Belum Dibayar</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Anda memiliki pesanan senilai Rp {pendingOrder.total_amount?.toLocaleString('id-ID')} yang belum dibayar.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleResumePendingPayment}
                    className="gradient-primary"
                    size="sm"
                    disabled={loading}
                  >
                    Lanjutkan Pembayaran
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPendingOrder(null)}
                  >
                    Buat Pesanan Baru
                  </Button>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <GlassCard>
            <h3 className="text-lg font-bold mb-4">Pesanan Anda</h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <span className="font-medium">{item.product.name}</span>
                    <span className="text-muted-foreground"> x{item.quantity}</span>
                  </div>
                  <span className="font-medium">
                    Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Payment Method */}
          <GlassCard>
            <h3 className="text-lg font-bold mb-4">Metode Pembayaran</h3>
            <div className="space-y-3">
              {/* Midtrans */}
              <button
                onClick={() => handleChangePaymentMethod('midtrans')}
                className={`w-full glass p-4 rounded-xl text-left transition-all ${paymentMethod === 'midtrans'
                  ? 'ring-2 ring-primary bg-primary/10'
                  : 'hover:bg-white/5'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${paymentMethod === 'midtrans' ? 'gradient-primary' : 'bg-muted'
                    }`}>
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Pembayaran Digital</div>
                    <div className="text-sm text-muted-foreground">
                      QRIS, GoPay, OVO, Bank Transfer, Kartu Kredit
                    </div>
                  </div>
                  {paymentMethod === 'midtrans' && (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  )}
                </div>
              </button>

              {/* Cash */}
              <button
                onClick={() => handleChangePaymentMethod('cash')}
                className={`w-full glass p-4 rounded-xl text-left transition-all ${paymentMethod === 'cash'
                  ? 'ring-2 ring-green-500 bg-green-500/10'
                  : 'hover:bg-white/5'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${paymentMethod === 'cash' ? 'bg-green-500' : 'bg-muted'
                    }`}>
                    <Banknote className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Bayar Tunai (Cash)</div>
                    <div className="text-sm text-muted-foreground">
                      Bayar langsung ke penjual, dikonfirmasi oleh seller
                    </div>
                  </div>
                  {paymentMethod === 'cash' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
              </button>
            </div>
          </GlassCard>

          {/* Notes */}
          <GlassCard>
            <h3 className="text-lg font-bold mb-4">Catatan Pesanan (Opsional)</h3>
            <Textarea
              placeholder="Tambahkan catatan untuk penjual..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="glass resize-none"
              rows={4}
            />
          </GlassCard>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <GlassCard className="sticky top-24 space-y-4">
            <h3 className="text-xl font-bold">Ringkasan Pembayaran</h3>

            <div className="space-y-3 py-4 border-y border-white/10">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({items.length} item)</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Biaya Layanan</span>
                <span>Rp {SERVICE_FEE.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span className="text-primary">
                Rp {total.toLocaleString('id-ID')}
              </span>
            </div>

            <Button
              onClick={handleCheckout}
              disabled={loading}
              className={`w-full h-12 ${paymentMethod === 'cash'
                ? 'bg-green-500 hover:bg-green-600'
                : 'gradient-primary glow-primary'
                }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </span>
              ) : paymentMethod === 'cash' ? (
                'Pesan & Bayar Tunai'
              ) : (
                'Bayar Sekarang'
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              {paymentMethod === 'cash'
                ? 'Pesanan akan dikonfirmasi setelah pembayaran tunai diterima'
                : 'Anda akan diarahkan ke halaman pembayaran Midtrans'}
            </p>
          </GlassCard>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="glass-strong border-primary/20 max-w-md">
          <div className="text-center space-y-6 py-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-24 h-24 rounded-full gradient-primary mx-auto flex items-center justify-center glow-primary"
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </motion.div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Pembayaran Berhasil!</h3>
              <p className="text-muted-foreground">
                Pesanan Anda telah berhasil dibuat dan sedang diproses
              </p>
            </div>

            <div className="glass p-4 rounded-xl">
              <p className="text-sm text-muted-foreground mb-1">Total Dibayar</p>
              <p className="text-2xl font-bold text-primary">
                Rp {total.toLocaleString('id-ID')}
              </p>
            </div>

            <Button
              onClick={handleSuccessClose}
              className="w-full gradient-primary glow-primary h-12"
            >
              Lihat Riwayat Pesanan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
