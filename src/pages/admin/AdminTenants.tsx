import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Edit, Trash2, Store, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { getAdminTenants, toggleTenantStatus } from '@/services/adminService';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Tenant {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  owner_id: string;
  owner_name: string;
  rating: number | null;
  is_active: boolean;
  created_at: string;
}

export function AdminTenants() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    image_url: '',
    owner_id: '',
  });

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const data = await getAdminTenants();
      setTenants(data as Tenant[]);

      // Fetch sellers for dropdown
      const { data: sellersData } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('role', 'seller');
      setSellers(sellersData || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast.error('Gagal memuat data tenant');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.owner_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (tenant?: Tenant) => {
    if (tenant) {
      setEditingTenant(tenant);
      setFormData({
        name: tenant.name,
        description: tenant.description || '',
        category: tenant.category || '',
        image_url: tenant.image_url || '',
        owner_id: tenant.owner_id,
      });
    } else {
      setEditingTenant(null);
      setFormData({
        name: '',
        description: '',
        category: '',
        image_url: '',
        owner_id: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.owner_id) {
      toast.error('Nama dan pemilik harus diisi');
      return;
    }

    try {
      setSaving(true);
      if (editingTenant) {
        const { error } = await supabase
          .from('tenants')
          .update({
            name: formData.name,
            description: formData.description,
            category: formData.category,
            image_url: formData.image_url,
            owner_id: formData.owner_id,
          })
          .eq('id', editingTenant.id);

        if (error) throw error;
        toast.success('Tenant berhasil diperbarui!');
      } else {
        const { error } = await supabase
          .from('tenants')
          .insert({
            name: formData.name,
            description: formData.description,
            category: formData.category,
            image_url: formData.image_url,
            owner_id: formData.owner_id,
            is_active: true,
          });

        if (error) throw error;
        toast.success('Tenant berhasil dibuat!');
      }
      setDialogOpen(false);
      fetchTenants();
    } catch (error: any) {
      toast.error(error.message || 'Gagal menyimpan tenant');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (tenant: Tenant) => {
    try {
      await toggleTenantStatus(tenant.id, !tenant.is_active);
      setTenants(tenants.map(t =>
        t.id === tenant.id ? { ...t, is_active: !t.is_active } : t
      ));
      toast.success(tenant.is_active ? 'Tenant dinonaktifkan' : 'Tenant diaktifkan');
    } catch (error) {
      toast.error('Gagal mengubah status tenant');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus tenant ini?')) return;

    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTenants(tenants.filter(t => t.id !== id));
      toast.success('Tenant berhasil dihapus!');
    } catch (error) {
      toast.error('Gagal menghapus tenant');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Memuat data tenant...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">Manajemen Tenant</h1>
          <p className="text-muted-foreground">Kelola semua tenant kantin</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-primary">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Tenant
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Cari tenant..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tenants Table */}
      {filteredTenants.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Tidak ada tenant</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Coba ubah pencarian' : 'Klik "Tambah Tenant" untuk membuat'}
          </p>
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead className="hidden sm:table-cell">Pemilik</TableHead>
                  <TableHead className="hidden md:table-cell">Kategori</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((tenant, index) => (
                  <motion.tr
                    key={tenant.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-muted/30"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={tenant.image_url || 'https://via.placeholder.com/48'}
                          alt={tenant.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 sm:hidden">
                            {tenant.owner_name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{tenant.owner_name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                        {tenant.category || 'Umum'}
                      </span>
                    </TableCell>
                    <TableCell>⭐ {(tenant.rating || 0).toFixed(1)}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggleActive(tenant)}
                        className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${tenant.is_active
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-red-500/20 text-red-500'
                          }`}
                      >
                        {tenant.is_active ? (
                          <><ToggleRight className="w-3 h-3" /> Aktif</>
                        ) : (
                          <><ToggleLeft className="w-3 h-3" /> Nonaktif</>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(tenant)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(tenant.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </GlassCard>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingTenant ? 'Edit Tenant' : 'Tambah Tenant Baru'}</DialogTitle>
            <DialogDescription>
              {editingTenant ? 'Perbarui informasi tenant' : 'Buat tenant baru'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Nama Tenant *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contoh: Warung Makan Jaya"
              />
            </div>
            <div>
              <Label htmlFor="owner">Pemilik *</Label>
              <Select
                value={formData.owner_id}
                onValueChange={(value) => setFormData({ ...formData, owner_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pemilik (role: seller)" />
                </SelectTrigger>
                <SelectContent>
                  {sellers.map(seller => (
                    <SelectItem key={seller.id} value={seller.id}>
                      {seller.name} ({seller.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Contoh: Makanan Indonesia Autentik"
              />
            </div>
            <div>
              <Label htmlFor="category">Kategori</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Contoh: Indonesian, Western, dll"
              />
            </div>
            <div>
              <Label htmlFor="image">URL Gambar</Label>
              <Input
                id="image"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingTenant ? 'Perbarui' : 'Buat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
