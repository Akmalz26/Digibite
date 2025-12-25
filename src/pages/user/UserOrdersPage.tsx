import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, Package, Timer, XCircle } from 'lucide-react';
import { getActiveOrders, getOrderHistory, cancelOrder } from '@/services/orderService';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { Order } from '@/types/database';

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

export function UserOrdersPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
    const [activeOrders, setActiveOrders] = useState<Order[]>([]);
    const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const [active, history] = await Promise.all([
                getActiveOrders(),
                getOrderHistory()
            ]);
            setActiveOrders(active);
            setHistoryOrders(history);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Gagal memuat pesanan');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();

        // Auto refresh every 30 seconds
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    const handlePay = (order: Order) => {
        if (!order.snap_token) {
            toast.error('Token pembayaran tidak ditemukan');
            return;
        }

        if (typeof window.snap === 'undefined') {
            toast.error('Sistem pembayaran belum siap, silakan refresh halaman');
            return;
        }

        window.snap.pay(order.snap_token, {
            onSuccess: (result) => {
                toast.success('Pembayaran berhasil!');
                fetchOrders();
                navigate(`/user/order/${order.id}`);
            },
            onPending: (result) => {
                toast.info('Menunggu pembayaran...');
                fetchOrders();
            },
            onError: (result) => {
                toast.error('Pembayaran gagal');
                console.error(result);
            },
            onClose: () => {
                toast.info('Popup pembayaran ditutup');
            }
        });
    };

    const handleCancelOrder = async (orderId: string) => {
        try {
            if (!confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) return;

            await cancelOrder(orderId);
            toast.success('Pesanan dibatalkan');
            fetchOrders(); // Refresh data
        } catch (error) {
            console.error('Error cancelling order:', error);
            toast.error('Gagal membatalkan pesanan');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'text-amber-500 bg-amber-500/10';
            case 'paid': return 'text-blue-500 bg-blue-500/10';
            case 'processing': return 'text-purple-500 bg-purple-500/10';
            case 'ready': return 'text-green-500 bg-green-500/10';
            case 'completed': return 'text-emerald-500 bg-emerald-500/10';
            case 'cancel': return 'text-red-500 bg-red-500/10';
            default: return 'text-gray-500 bg-gray-500/10';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Menunggu Pembayaran';
            case 'paid': return 'Dibayar / Menunggu Konfirmasi';
            case 'processing': return 'Sedang Diproses';
            case 'ready': return 'Siap Diambil';
            case 'completed': return 'Selesai';
            case 'cancel': return 'Dibatalkan';
            default: return status;
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-primary">Pesanan Saya</h1>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-md">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'active'
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <Timer className="w-4 h-4" />
                        <span>Sedang Berjalan</span>
                        {activeOrders.length > 0 && (
                            <span className="bg-white/20 text-white px-1.5 py-0.5 rounded-full text-[10px]">
                                {activeOrders.length}
                            </span>
                        )}
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'history'
                        ? 'bg-primary text-white shadow-lg shadow-primary/30'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Riwayat</span>
                    </div>
                </button>
            </div>

            {/* Content */}
            <AnimatePresence mode='wait'>
                {loading ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-12"
                    >
                        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        <p className="mt-4 text-muted-foreground text-sm">Memuat pesanan...</p>
                    </motion.div>
                ) : (
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                    >
                        {(activeTab === 'active' ? activeOrders : historyOrders).length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                                    <Package className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium text-foreground">Belum ada pesanan</h3>
                                <p className="text-muted-foreground text-sm mt-1 max-w-xs">
                                    {activeTab === 'active'
                                        ? 'Anda tidak memiliki pesanan yang sedang berjalan saat ini.'
                                        : 'Riwayat pesanan Anda masih kosong.'}
                                </p>
                            </div>
                        ) : (
                            (activeTab === 'active' ? activeOrders : historyOrders).map((order) => (
                                <GlassCard key={order.id} className="p-4 overflow-hidden relative group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(order.status)}`}>
                                                <Package className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-foreground">
                                                    {(order as any).tenant_name || 'Tenant'}
                                                </h3>
                                                <p className="text-xs text-muted-foreground">ID: {order.midtrans_order_id}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-border/50">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground">Total Pembayaran</span>
                                            <span className="font-bold text-primary">Rp {order.total_amount.toLocaleString('id-ID')}</span>
                                        </div>
                                        <div>
                                            {order.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/10"
                                                        onClick={() => handleCancelOrder(order.id)}
                                                    >
                                                        Batalkan
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handlePay(order)}
                                                    >
                                                        Bayar
                                                    </Button>
                                                </div>
                                            )}

                                        </div>
                                    </div>

                                    {/* Status Progress Indicator for Active Orders */}
                                    {activeTab === 'active' && order.status !== 'pending' && (
                                        <div className="mt-4 bg-muted/30 rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Timer className="w-4 h-4 text-primary" />
                                                <span className="text-xs font-medium">Status Terkini</span>
                                            </div>
                                            <p className="text-sm text-foreground">
                                                {order.status === 'paid' && 'Pesanan telah dibayar, menunggu konfirmasi penjual.'}
                                                {order.status === 'processing' && 'Pesanan sedang disiapkan oleh penjual.'}
                                                {order.status === 'ready' && 'Pesanan siap diambil! Silakan ke kantin.'}
                                            </p>
                                        </div>
                                    )}
                                </GlassCard>
                            ))
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
