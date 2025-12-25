import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import {
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductAvailability
} from '@/services/productService';
import type { Product } from '@/types/database';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function SellerProducts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    image_url: '',
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getMyProducts();
      setProducts(data);
    } catch (error: any) {
      toast.error('Gagal memuat produk');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: '',
      image_url: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category || '',
      image_url: product.image_url || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;

    try {
      await deleteProduct(id);
      toast.success('Produk berhasil dihapus');
      fetchProducts();
    } catch (error: any) {
      toast.error('Gagal menghapus produk');
    }
  };

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      await toggleProductAvailability(id, !currentStatus);
      toast.success('Status produk diperbarui');
      fetchProducts();
    } catch (error: any) {
      toast.error('Gagal mengubah status produk');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category,
        image_url: formData.image_url,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        toast.success('Produk berhasil diperbarui');
      } else {
        await createProduct(productData);
        toast.success('Produk berhasil ditambahkan');
      }

      setIsDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan produk');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Memuat produk...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Produk</h1>
          <p className="text-muted-foreground">Kelola inventori produk Anda</p>
        </div>
        <Button onClick={handleAddProduct} className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Produk
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cari produk..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Tidak ada produk</h3>
          <p className="text-muted-foreground mb-4">Mulai dengan menambahkan produk pertama Anda</p>
          <Button onClick={handleAddProduct} className="gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Produk
          </Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard className="overflow-hidden">
                <div className="relative h-48">
                  <img
                    src={product.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {!product.is_available && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-medium">Tidak Tersedia</span>
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description || 'Tidak ada deskripsi'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-primary">
                        Rp {product.price.toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stok: {product.stock}
                      </p>
                    </div>
                    {product.category && (
                      <span className="text-xs px-2 py-1 rounded-full bg-muted">
                        {product.category}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleToggleAvailability(product.id, product.is_available)}
                    >
                      {product.is_available ? (
                        <><EyeOff className="w-4 h-4 mr-1" /> Sembunyikan</>
                      ) : (
                        <><Eye className="w-4 h-4 mr-1" /> Tampilkan</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Perbarui informasi produk Anda'
                : 'Isi detail untuk menambahkan produk baru'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveProduct} className="space-y-4">
            <div>
              <Label htmlFor="name">Nama Produk</Label>
              <Input
                id="name"
                placeholder="contoh: Nasi Goreng Special"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                placeholder="Deskripsikan produk Anda..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Harga (Rp)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="15000"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="stock">Stok</Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="50"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category">Kategori</Label>
              <Input
                id="category"
                placeholder="contoh: Makanan Utama"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div>
              <Label>Gambar Produk</Label>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Show preview immediately
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setFormData({ ...formData, image_url: ev.target?.result as string });
                      };
                      reader.readAsDataURL(file);

                      // Upload to Supabase
                      try {
                        const { uploadImage } = await import('@/services/storageService');
                        const url = await uploadImage(file, 'product-images');
                        setFormData(prev => ({ ...prev, image_url: url }));
                      } catch (err: any) {
                        console.error('Upload error:', err);
                      }
                    }
                  }}
                  className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                />
                {formData.image_url && (
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="mt-2 w-full h-32 object-cover rounded-lg"
                  />
                )}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" className="gradient-primary" disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {editingProduct ? 'Perbarui' : 'Tambah'} Produk
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
