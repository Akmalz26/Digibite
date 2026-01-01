import { motion } from 'framer-motion';
import { ShoppingCart, Plus, Minus, Trash2, ArrowRight, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cartStore';

export const CartPage = () => {
  const navigate = useNavigate();
  const { items, updateQuantity, removeFromCart, getTotalPrice, getCurrentTenantName } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-strong rounded-full w-32 h-32 flex items-center justify-center mb-6"
        >
          <ShoppingCart className="w-16 h-16 text-muted-foreground" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">Keranjang Kosong</h2>
        <p className="text-muted-foreground mb-6">
          Yuk, mulai belanja dan isi keranjangmu!
        </p>
        <Button onClick={() => navigate('/user')} className="gradient-primary">
          Mulai Belanja
        </Button>
      </div>
    );
  }

  const tenantName = getCurrentTenantName();

  return (
    <div className="space-y-6 pb-32">
      <div>
        <h1 className="text-3xl font-bold mb-2">Keranjang Belanja</h1>
        <p className="text-muted-foreground">{items.length} item di keranjang</p>
      </div>

      {/* Current Tenant Info */}
      {tenantName && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-primary/10 rounded-lg px-4 py-2">
          <Store className="w-4 h-4" />
          <span>Pesanan dari: <strong className="text-foreground">{tenantName}</strong></span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item, idx) => (
            <motion.div
              key={item.product.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <GlassCard className="p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold mb-1">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.product.tenantName}
                    </p>
                    <div className="font-bold text-primary">
                      Rp {item.product.price.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <GlassCard className="sticky top-24 space-y-4">
            <h3 className="text-xl font-bold">Ringkasan Belanja</h3>

            <div className="space-y-3 py-4 border-y border-white/10">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>Rp {getTotalPrice().toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Biaya Layanan</span>
                <span>Rp 2.000</span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">
                Rp {(getTotalPrice() + 2000).toLocaleString('id-ID')}
              </span>
            </div>

            <Button
              onClick={() => navigate('/user/checkout')}
              className="w-full gradient-primary glow-primary h-12"
            >
              Lanjut ke Pembayaran
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
