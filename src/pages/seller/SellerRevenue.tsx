import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  ArrowDownCircle,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  TrendingUp,
  Building
} from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getMyTenant } from '@/services/tenantService';

interface Withdrawal {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  bank_name: string;
  account_number: string;
  account_name: string;
  notes: string;
  admin_notes: string;
  created_at: string;
  processed_at: string;
}

export function SellerRevenue() {
  const [tenant, setTenant] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    bank_name: '',
    account_number: '',
    account_name: '',
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get tenant
      const tenantData = await getMyTenant();
      setTenant(tenantData);

      if (tenantData) {
        // Get withdrawals
        const { data: withdrawalsData } = await supabase
          .from('withdrawals')
          .select('*')
          .eq('tenant_id', tenantData.id)
          .order('created_at', { ascending: false });

        setWithdrawals(withdrawalsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(withdrawForm.amount);

    if (amount < 10000) {
      toast.error('Minimal penarikan Rp 10.000');
      return;
    }

    if (amount > (tenant?.balance || 0)) {
      toast.error('Saldo tidak mencukupi');
      return;
    }

    if (!withdrawForm.bank_name || !withdrawForm.account_number || !withdrawForm.account_name) {
      toast.error('Lengkapi data rekening');
      return;
    }

    setWithdrawing(true);
    try {
      const { error } = await supabase
        .from('withdrawals')
        .insert({
          tenant_id: tenant.id,
          amount: amount,
          bank_name: withdrawForm.bank_name,
          account_number: withdrawForm.account_number,
          account_name: withdrawForm.account_name,
          notes: withdrawForm.notes,
        } as any);

      if (error) throw error;

      toast.success('Pengajuan penarikan berhasil dikirim');
      setShowWithdrawDialog(false);
      setWithdrawForm({
        amount: '',
        bank_name: '',
        account_number: '',
        account_name: '',
        notes: '',
      });
      fetchData();
    } catch (error: any) {
      toast.error('Gagal mengajukan penarikan');
    } finally {
      setWithdrawing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusConfig = {
    pending: { label: 'Menunggu', color: 'text-yellow-500 bg-yellow-500/10', icon: Clock },
    approved: { label: 'Disetujui', color: 'text-green-500 bg-green-500/10', icon: CheckCircle },
    rejected: { label: 'Ditolak', color: 'text-red-500 bg-red-500/10', icon: XCircle },
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Memuat data pendapatan...</p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <GlassCard className="p-12 text-center">
        <Wallet className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-xl font-semibold mb-2">Belum Ada Toko</h3>
        <p className="text-muted-foreground">Buat toko terlebih dahulu untuk melihat pendapatan</p>
      </GlassCard>
    );
  }

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const pendingAmount = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);
  const availableBalance = (tenant.balance || 0) - pendingAmount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient mb-2">Pendapatan</h1>
        <p className="text-muted-foreground">Kelola pendapatan dan penarikan saldo</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Saldo</p>
              <p className="text-2xl font-bold">
                Rp {(tenant.balance || 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-7 h-7 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dalam Proses</p>
              <p className="text-2xl font-bold text-yellow-500">
                Rp {pendingAmount.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dapat Ditarik</p>
              <p className="text-2xl font-bold text-green-500">
                Rp {availableBalance.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Withdraw Button */}
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-lg">Tarik Saldo</h3>
            <p className="text-sm text-muted-foreground">
              Minimal penarikan Rp 10.000
            </p>
          </div>
          <Button
            className="gradient-primary glow-primary"
            onClick={() => setShowWithdrawDialog(true)}
            disabled={availableBalance < 10000}
          >
            <ArrowDownCircle className="w-4 h-4 mr-2" />
            Tarik Saldo
          </Button>
        </div>
      </GlassCard>

      {/* Withdrawal History */}
      <GlassCard>
        <h3 className="font-semibold text-lg mb-4">Riwayat Penarikan</h3>

        {withdrawals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ArrowDownCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Belum ada riwayat penarikan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((withdrawal) => {
              const status = statusConfig[withdrawal.status];
              const StatusIcon = status.icon;

              return (
                <div
                  key={withdrawal.id}
                  className="glass p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status.color}`}>
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold">
                        Rp {withdrawal.amount.toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {withdrawal.bank_name} - {withdrawal.account_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(withdrawal.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                      {status.label}
                    </span>
                    {withdrawal.admin_notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {withdrawal.admin_notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tarik Saldo</DialogTitle>
            <DialogDescription>
              Saldo tersedia: Rp {availableBalance.toLocaleString('id-ID')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <Label htmlFor="amount">Jumlah Penarikan</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rp</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="10000"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                  className="pl-10"
                  min={10000}
                  max={availableBalance}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Minimal Rp 10.000
              </p>
            </div>

            <div>
              <Label htmlFor="bank">Nama Bank</Label>
              <Input
                id="bank"
                placeholder="BCA, BNI, Mandiri, dll"
                value={withdrawForm.bank_name}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, bank_name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="account_number">Nomor Rekening</Label>
              <Input
                id="account_number"
                placeholder="1234567890"
                value={withdrawForm.account_number}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, account_number: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="account_name">Nama Pemilik Rekening</Label>
              <Input
                id="account_name"
                placeholder="Nama sesuai rekening"
                value={withdrawForm.account_name}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, account_name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">Catatan (Opsional)</Label>
              <Input
                id="notes"
                placeholder="Catatan tambahan"
                value={withdrawForm.notes}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowWithdrawDialog(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1 gradient-primary"
                disabled={withdrawing}
              >
                {withdrawing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ArrowDownCircle className="w-4 h-4 mr-2" />
                )}
                Ajukan Penarikan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
