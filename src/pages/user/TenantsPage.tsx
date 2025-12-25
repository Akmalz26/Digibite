import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Star, Clock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '@/components/GlassCard';
import { Input } from '@/components/ui/input';
import { getTenants, searchTenants } from '@/services/tenantService';
import type { Tenant } from '@/types/database';
import { toast } from 'sonner';

export const TenantsPage = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const data = searchQuery
        ? await searchTenants(searchQuery)
        : await getTenants();
      setTenants(data);
    } catch (error: any) {
      console.error('Error fetching tenants:', error);
      toast.error('Gagal memuat daftar tenant');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTenants();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  if (loading && tenants.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Memuat daftar tenant...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Semua Tenant</h1>
            <p className="text-muted-foreground">
              Temukan tenant favorit Anda di Kantin Digitech
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Cari tenant..."
            className="pl-12 glass"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tenant Grid */}
      {tenants.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Tidak ada tenant ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map((tenant, idx) => (
            <motion.div
              key={tenant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <GlassCard
                className="overflow-hidden p-0 cursor-pointer"
                onClick={() => navigate(`/user/tenant/${tenant.id}`)}
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={tenant.image_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'}
                    alt={tenant.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  {/* Rating Badge */}
                  <div className="absolute top-4 right-4 glass px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold">{tenant.rating?.toFixed(1) || '0.0'}</span>
                  </div>

                  {/* Category Badge */}
                  {tenant.category && (
                    <div className="absolute bottom-4 left-4 glass px-3 py-1 rounded-lg text-sm font-medium">
                      {tenant.category}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-xl font-bold mb-2">{tenant.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {tenant.description || 'Tidak ada deskripsi'}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>Kantin Digitech</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>15-20 min</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
