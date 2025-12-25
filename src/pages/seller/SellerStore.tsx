import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ImageUpload';
import {
    Store,
    Edit,
    Save,
    X,
    DollarSign,
    Star,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { getMyTenant, createTenant, updateTenant } from '@/services/tenantService';
import type { Tenant } from '@/types/database';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const categories = [
    'Makanan Berat',
    'Makanan Ringan',
    'Minuman',
    'Snack',
    'Dessert',
    'Lainnya',
];

export function SellerStore() {
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        image_url: '',
        category: '',
    });

    const fetchTenant = async () => {
        try {
            setLoading(true);
            const data = await getMyTenant();
            setTenant(data);
            if (data) {
                setFormData({
                    name: data.name,
                    description: data.description || '',
                    image_url: data.image_url || '',
                    category: data.category || '',
                });
            }
        } catch (error: any) {
            console.log('No tenant found');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenant();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Nama toko harus diisi');
            return;
        }

        setSaving(true);
        try {
            await createTenant({
                name: formData.name,
                description: formData.description,
                image_url: formData.image_url,
                category: formData.category,
            });
            toast.success('Toko berhasil dibuat!');
            setIsCreating(false);
            fetchTenant();
        } catch (error: any) {
            toast.error(error.message || 'Gagal membuat toko');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenant) return;

        setSaving(true);
        try {
            await updateTenant(tenant.id, {
                name: formData.name,
                description: formData.description,
                image_url: formData.image_url,
                category: formData.category,
            });
            toast.success('Toko berhasil diperbarui!');
            setIsEditing(false);
            fetchTenant();
        } catch (error: any) {
            toast.error(error.message || 'Gagal memperbarui toko');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setIsCreating(false);
        if (tenant) {
            setFormData({
                name: tenant.name,
                description: tenant.description || '',
                image_url: tenant.image_url || '',
                category: tenant.category || '',
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Memuat data toko...</p>
            </div>
        );
    }

    // No tenant - show create prompt
    if (!tenant && !isCreating) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gradient mb-2">Pengaturan Toko</h1>
                    <p className="text-muted-foreground">Kelola informasi toko Anda</p>
                </div>

                <GlassCard className="p-12 text-center">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                            <Store className="w-12 h-12 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Belum Ada Toko</h2>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            Anda belum memiliki toko di Digibite. Buat toko sekarang untuk mulai menjual produk!
                        </p>
                        <Button onClick={() => setIsCreating(true)} className="gradient-primary glow-primary">
                            <Store className="w-4 h-4 mr-2" />
                            Buat Toko Saya
                        </Button>
                    </motion.div>
                </GlassCard>
            </div>
        );
    }

    // Create form
    if (isCreating) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gradient mb-2">Buat Toko Baru</h1>
                    <p className="text-muted-foreground">Isi informasi toko Anda</p>
                </div>

                <GlassCard>
                    <form onSubmit={handleCreate} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Toko *</Label>
                                <Input
                                    id="name"
                                    placeholder="contoh: Warung Makan Bu Siti"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Kategori</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Deskripsi Toko</Label>
                            <Textarea
                                id="description"
                                placeholder="Ceritakan tentang toko Anda..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Gambar Toko</Label>
                            <ImageUpload
                                value={formData.image_url}
                                onChange={(url) => setFormData({ ...formData, image_url: url })}
                                bucket="tenant-images"
                                aspectRatio="video"
                            />
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button type="button" variant="outline" onClick={handleCancel}>
                                <X className="w-4 h-4 mr-2" />
                                Batal
                            </Button>
                            <Button type="submit" className="gradient-primary" disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Buat Toko
                            </Button>
                        </div>
                    </form>
                </GlassCard>
            </div>
        );
    }

    // View/Edit existing tenant
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gradient mb-2">Pengaturan Toko</h1>
                    <p className="text-muted-foreground">Kelola informasi toko Anda</p>
                </div>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)} variant="outline">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-green-400/10 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Saldo</p>
                            <p className="text-xl font-bold">Rp {tenant!.balance.toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-yellow-400/10 flex items-center justify-center">
                            <Star className="w-6 h-6 text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Rating</p>
                            <p className="text-xl font-bold">{tenant!.rating?.toFixed(1) || '0.0'}</p>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${tenant!.is_active ? 'bg-green-400/10' : 'bg-red-400/10'}`}>
                            <AlertCircle className={`w-6 h-6 ${tenant!.is_active ? 'text-green-400' : 'text-red-400'}`} />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <p className={`text-xl font-bold ${tenant!.is_active ? 'text-green-400' : 'text-red-400'}`}>
                                {tenant!.is_active ? 'Aktif' : 'Nonaktif'}
                            </p>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Store Info Card */}
            <GlassCard>
                {isEditing ? (
                    <form onSubmit={handleUpdate} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Toko *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Kategori</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Deskripsi Toko</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Gambar Toko</Label>
                            <ImageUpload
                                value={formData.image_url}
                                onChange={(url) => setFormData({ ...formData, image_url: url })}
                                bucket="tenant-images"
                                aspectRatio="video"
                            />
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button type="button" variant="outline" onClick={handleCancel}>
                                <X className="w-4 h-4 mr-2" />
                                Batal
                            </Button>
                            <Button type="submit" className="gradient-primary" disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Simpan Perubahan
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-6">
                        {/* Store Image */}
                        <div className="relative w-full h-48 rounded-xl overflow-hidden">
                            <img
                                src={tenant!.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'}
                                alt={tenant!.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-4 left-4">
                                <h2 className="text-2xl font-bold text-white">{tenant!.name}</h2>
                                {tenant!.category && (
                                    <span className="inline-block mt-1 px-3 py-1 rounded-full glass text-sm">
                                        {tenant!.category}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h3 className="font-semibold mb-2">Deskripsi</h3>
                            <p className="text-muted-foreground">
                                {tenant!.description || 'Tidak ada deskripsi'}
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                            <div>
                                <p className="text-sm text-muted-foreground">Terdaftar sejak</p>
                                <p className="font-medium">
                                    {new Date(tenant!.created_at).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Terakhir diperbarui</p>
                                <p className="font-medium">
                                    {new Date(tenant!.updated_at).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
