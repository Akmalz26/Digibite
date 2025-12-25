import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Store, Mail, Lock, User, UserPlus, Phone } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassCard } from '@/components/GlassCard';
import { toast } from 'sonner';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated, profile, initialize } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && profile) {
      const paths = {
        admin: '/admin',
        seller: '/seller',
        user: '/user',
      };
      navigate(paths[profile.role] || '/user');
    }
  }, [isAuthenticated, profile, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn(email, password);
      if (result.success) {
        toast.success('Login berhasil!');
      } else {
        toast.error(result.error || 'Login gagal! Periksa email dan password Anda.');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signUp(email, password, name, phone);
      if (result.success) {
        toast.success('Registrasi berhasil! Silakan cek email untuk verifikasi.');
        setIsRegister(false);
      } else {
        toast.error(result.error || 'Registrasi gagal!');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat registrasi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl"
          animate={{
            rotate: [0, 360],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-3 mb-6"
          >
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <img
                src="/logo.png"
                alt="Digibite Logo"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl object-contain shadow-lg"
              />
            </motion.div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl sm:text-5xl font-bold text-primary mb-2 sm:mb-3 tracking-tight"
          >
            Digibite
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground text-base sm:text-lg"
          >
            Kantin Digital Digitech University
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassCard glow className="glass-strong">
            {isRegister ? (
              // Register Form
              <form onSubmit={handleRegister} className="space-y-5">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-semibold">Daftar Akun Baru</h2>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                    <Input
                      type="text"
                      placeholder="Nama Anda"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 glass"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 glass"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">No. WhatsApp</label>
                  <div className="relative flex">
                    <div className="flex items-center gap-1.5 pl-3 pr-2 bg-muted/50 border border-r-0 rounded-l-md text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm font-medium">+62</span>
                    </div>
                    <Input
                      type="tel"
                      placeholder="81234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="glass rounded-l-none"
                      required
                      pattern="[0-9]{9,13}"
                      title="Masukkan nomor WhatsApp yang valid"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nomor ini akan digunakan untuk konfirmasi pesanan
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 glass"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-primary glow-primary h-12 text-base font-semibold"
                  disabled={loading}
                >
                  {loading ? 'Memproses...' : 'Daftar'}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Sudah punya akun?{' '}
                  <button
                    type="button"
                    className="text-primary hover:underline font-medium"
                    onClick={() => setIsRegister(false)}
                  >
                    Masuk
                  </button>
                </div>
              </form>
            ) : (
              // Login Form
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 glass"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 glass"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-primary glow-primary h-12 text-base font-semibold"
                  disabled={loading}
                >
                  {loading ? 'Memproses...' : 'Masuk'}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Belum punya akun?{' '}
                  <button
                    type="button"
                    className="text-primary hover:underline font-medium"
                    onClick={() => setIsRegister(true)}
                  >
                    Daftar Sekarang
                  </button>
                </div>
              </form>
            )}
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
};
