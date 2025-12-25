import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, MapPin, ArrowLeft, Plus, Minus, ShoppingCart, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { getTenantById } from '@/services/tenantService';
import { getProductsByTenant } from '@/services/productService';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
import type { Tenant, Product } from '@/types/database';

// Map database product to cart-compatible product
const mapToCartProduct = (product: Product, tenant: Tenant) => ({
  id: product.id,
  tenantId: product.tenant_id,
  tenantName: tenant.name,
  name: product.name,
  description: product.description || '',
  price: product.price,
  image: product.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
  category: product.category || '',
  stock: product.stock,
  isAvailable: product.is_available,
  createdAt: product.created_at,
});

export const TenantDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const [tenantData, productsData] = await Promise.all([
          getTenantById(id),
          getProductsByTenant(id),
        ]);
        setTenant(tenantData);
        setProducts(productsData);
      } catch (error: any) {
        console.error('Error fetching tenant:', error);
        toast.error('Gagal memuat data tenant');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-2">Tenant tidak ditemukan</h2>
        <Button onClick={() => navigate('/user/tenants')}>Kembali</Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (selectedProduct && tenant) {
      const cartProduct = mapToCartProduct(selectedProduct, tenant);
      addToCart(cartProduct as any, quantity);
      toast.success(`${selectedProduct.name} ditambahkan ke keranjang!`);
      setSelectedProduct(null);
      setQuantity(1);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali
      </Button>

      {/* Tenant Header */}
      <GlassCard className="overflow-hidden p-0">
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img
            src={tenant.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'}
            alt={tenant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{tenant.name}</h1>
                <p className="text-white/90 text-lg">{tenant.description}</p>
              </div>
              <div className="glass px-4 py-2 rounded-xl flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-lg">{tenant.rating?.toFixed(1) || '0.0'}</span>
              </div>
            </div>

            <div className="flex items-center gap-6 text-white/80">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Kantin Digitech University</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">15-20 menit</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Products */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Menu</h2>
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Belum ada produk tersedia</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <GlassCard
                  className="overflow-hidden p-0 cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={product.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    {!product.is_available && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="glass px-4 py-2 rounded-lg font-semibold">
                          Tidak Tersedia
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold mb-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {product.description || 'Tidak ada deskripsi'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        Rp {product.price.toLocaleString('id-ID')}
                      </span>
                      <Button size="sm" className="gradient-primary">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-2xl max-w-2xl w-full overflow-hidden"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={selectedProduct.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedProduct.name}</h2>
                  <p className="text-muted-foreground">{selectedProduct.description}</p>
                </div>

                <div className="text-2xl font-bold text-primary">
                  Rp {selectedProduct.price.toLocaleString('id-ID')}
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Jumlah:</span>
                  <div className="flex items-center gap-3">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-xl font-bold w-12 text-center">{quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedProduct(null)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleAddToCart}
                    className="flex-1 gradient-primary glow-primary"
                    disabled={!selectedProduct.is_available}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Tambah ke Keranjang
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
