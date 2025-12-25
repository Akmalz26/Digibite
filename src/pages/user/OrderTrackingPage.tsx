import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
    CheckCircle,
    Clock,
    Package,
    Truck,
    ShoppingBag,
    ArrowLeft,
    Loader2,
    Phone,
    MapPin
} from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { getOrderDetails, subscribeToOrderStatus } from '@/services/orderService';
import { toast } from 'sonner';

const orderSteps = [
    { key: 'pending', label: 'Belum Dibayar', icon: Clock },
    { key: 'paid', label: 'Dibayar', icon: CheckCircle },
    { key: 'processing', label: 'Di Proses', icon: Package },
    { key: 'completed', label: 'Selesai', icon: CheckCircle },
];

const getStepIndex = (status: string): number => {
    const statusMap: Record<string, number> = {
        pending: 0,
        paid: 1,
        processing: 2,
        ready: 2, // ready maps to processing step
        delivered: 2, // delivered maps to processing step
        completed: 3,
        cancel: -1,
    };
    return statusMap[status] ?? 0;
};

export const OrderTrackingPage = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrder = async () => {
        if (!orderId) return;

        try {
            setLoading(true);
            const data = await getOrderDetails(orderId);
            setOrder(data.order);
            setItems(data.items);
        } catch (error) {
            toast.error('Gagal memuat detail pesanan');
            navigate('/user/history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [orderId]);

    // Realtime subscription
    useEffect(() => {
        if (!orderId) return;

        const unsubscribe = subscribeToOrderStatus(orderId, (updatedOrder) => {
            setOrder((prev: any) => ({ ...prev, ...updatedOrder }));

            // Show toast based on new status
            const statusMessages: Record<string, string> = {
                paid: '✓ Pembayaran dikonfirmasi!',
                processing: '🍳 Pesanan sedang diproses...',
                ready: '📦 Pesanan siap diambil!',
                delivered: '🚗 Pesanan sedang diantar...',
                completed: '🎉 Pesanan telah selesai!',
                cancel: '❌ Pesanan dibatalkan',
            };

            if (statusMessages[updatedOrder.status]) {
                toast.success(statusMessages[updatedOrder.status]);
            }
        });

        return () => unsubscribe();
    }, [orderId]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Memuat detail pesanan...</p>
            </div>
        );
    }

    if (!order) {
        return null;
    }

    const currentStep = getStepIndex(order.status);
    const isCancelled = order.status === 'cancel';

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/user/history')}
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Detail Pesanan</h1>
                    <p className="text-sm text-muted-foreground">{order.midtrans_order_id}</p>
                </div>
            </div>

            {/* Status Card */}
            <GlassCard className={isCancelled ? 'border-red-500/30' : ''}>
                {isCancelled ? (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 rounded-full bg-red-500/10 mx-auto flex items-center justify-center mb-4">
                            <Clock className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-red-500">Pesanan Dibatalkan</h2>
                        <p className="text-muted-foreground mt-2">Pesanan ini telah dibatalkan</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Progress Steps */}
                        <div className="relative">
                            {orderSteps.map((step, index) => {
                                const Icon = step.icon;
                                const isActive = index <= currentStep;
                                const isCurrent = index === currentStep;

                                return (
                                    <div key={step.key} className="flex items-start gap-4 relative">
                                        {/* Connector Line */}
                                        {index < orderSteps.length - 1 && (
                                            <div
                                                className={`absolute left-5 top-10 w-0.5 h-12 ${index < currentStep ? 'bg-primary' : 'bg-muted'
                                                    }`}
                                            />
                                        )}

                                        {/* Step Circle */}
                                        <motion.div
                                            initial={{ scale: 0.8 }}
                                            animate={{
                                                scale: isCurrent ? [1, 1.1, 1] : 1,
                                            }}
                                            transition={{
                                                repeat: isCurrent ? Infinity : 0,
                                                duration: 2
                                            }}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${isActive
                                                ? 'bg-primary text-white'
                                                : 'bg-muted text-muted-foreground'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </motion.div>

                                        {/* Step Content */}
                                        <div className={`pb-8 ${!isActive && 'opacity-50'}`}>
                                            <p className={`font-medium ${isCurrent && 'text-primary'}`}>
                                                {step.label}
                                            </p>
                                            {isCurrent && (
                                                <motion.p
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="text-sm text-muted-foreground"
                                                >
                                                    {step.key === 'pending' && 'Silakan selesaikan pembayaran'}
                                                    {step.key === 'paid' && 'Pembayaran diterima, menunggu proses'}
                                                    {step.key === 'processing' && 'Pesanan sedang disiapkan'}
                                                    {step.key === 'completed' && 'Terima kasih telah memesan!'}
                                                </motion.p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </GlassCard>

            {/* Order Summary */}
            <GlassCard>
                <h3 className="font-semibold text-lg mb-4">Ringkasan Pesanan</h3>

                <div className="space-y-3">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                            {item.product_image && (
                                <img
                                    src={item.product_image}
                                    alt={item.product_name}
                                    className="w-12 h-12 rounded-lg object-cover"
                                />
                            )}
                            <div className="flex-1">
                                <p className="font-medium">{item.product_name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {item.quantity}x @ Rp {item.price_at_time?.toLocaleString('id-ID')}
                                </p>
                            </div>
                            <p className="font-medium">
                                Rp {item.subtotal?.toLocaleString('id-ID')}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="border-t border-white/10 mt-4 pt-4">
                    <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">
                            Rp {order.total_amount?.toLocaleString('id-ID')}
                        </span>
                    </div>
                </div>
            </GlassCard>

            {/* Notes */}
            {order.notes && (
                <GlassCard>
                    <h3 className="font-semibold mb-2">Catatan</h3>
                    <p className="text-muted-foreground">{order.notes}</p>
                </GlassCard>
            )}

            {/* Contact Seller */}
            {order.tenants?.phone && (
                <GlassCard>
                    <h3 className="font-semibold mb-3">Hubungi Penjual</h3>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(`https://wa.me/${order.tenants.phone.replace('+', '')}`, '_blank')}
                    >
                        <Phone className="w-4 h-4 mr-2" />
                        WhatsApp Penjual
                    </Button>
                </GlassCard>
            )}
        </div>
    );
};
