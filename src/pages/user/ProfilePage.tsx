import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Mail, Camera, Loader2, Save } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/services/storageService';
import { toast } from 'sonner';

export const ProfilePage = () => {
    const { profile, user, initialize } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        avatar_url: '',
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || '',
                phone: profile.phone || '',
                avatar_url: profile.avatar_url || '',
            });
        }
    }, [profile]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadImage(file, 'avatars');
            setFormData(prev => ({ ...prev, avatar_url: url }));
            toast.success('Foto berhasil diupload');
        } catch (error: any) {
            toast.error('Gagal upload foto');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            const updateData = {
                name: formData.name,
                phone: formData.phone,
                avatar_url: formData.avatar_url,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('profiles')
                // @ts-expect-error - Supabase type inference issue with .update()
                .update(updateData)
                .eq('id', user.id);

            if (error) throw error;

            await initialize(); // Refresh profile
            toast.success('Profil berhasil diperbarui');
        } catch (error: any) {
            toast.error('Gagal memperbarui profil');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Profil Saya</h1>
                <p className="text-muted-foreground">Kelola informasi profil Anda</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar */}
                <GlassCard>
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                                {formData.avatar_url ? (
                                    <img
                                        src={formData.avatar_url}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-12 h-12 text-primary" />
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-colors">
                                {uploading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Camera className="w-4 h-4" />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">{profile?.name || 'Nama Anda'}</h3>
                            <p className="text-sm text-muted-foreground">{user?.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Klik ikon kamera untuk mengubah foto
                            </p>
                        </div>
                    </div>
                </GlassCard>

                {/* Personal Info */}
                <GlassCard>
                    <h3 className="font-semibold text-lg mb-4">Informasi Pribadi</h3>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name">Nama Lengkap</Label>
                            <div className="relative mt-1">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="pl-10"
                                    placeholder="Nama Anda"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="email">Email</Label>
                            <div className="relative mt-1">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    value={user?.email || ''}
                                    className="pl-10"
                                    disabled
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Email tidak dapat diubah
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="phone">No. WhatsApp</Label>
                            <div className="relative mt-1">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="pl-10"
                                    placeholder="+62812345678"
                                />
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Account Info */}
                <GlassCard>
                    <h3 className="font-semibold text-lg mb-4">Informasi Akun</h3>
                    <div className="space-y-2 text-sm">
                        {/* <div className="flex justify-between">
                            <span className="text-muted-foreground">Role</span>
                            <span className="capitalize font-medium">{profile?.role}</span>
                        </div> */}
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Bergabung sejak</span>
                            <span>
                                {profile?.created_at
                                    ? new Date(profile.created_at).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })
                                    : '-'}
                            </span>
                        </div>
                    </div>
                </GlassCard>

                <Button
                    type="submit"
                    className="w-full gradient-primary glow-primary h-12"
                    disabled={loading}
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                        <Save className="w-4 h-4 mr-2" />
                    )}
                    Simpan Perubahan
                </Button>
            </form>
        </div>
    );
};
