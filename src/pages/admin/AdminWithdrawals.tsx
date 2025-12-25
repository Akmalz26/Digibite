import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Wallet,
    ArrowDownCircle,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    Building,
    Search,
    Filter,
    ChevronDown
} from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Withdrawal {
    id: string;
    tenant_id: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    bank_name: string;
    account_number: string;
    account_name: string;
    notes: string;
    admin_notes: string;
    created_at: string;
    processed_at: string;
    tenants?: {
        name: string;
        owner_id: string;
        balance: number;
    };
}

export function AdminWithdrawals() {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
    const [showActionDialog, setShowActionDialog] = useState(false);
    const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
    const [adminNotes, setAdminNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const [stats, setStats] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,
        totalPending: 0,
    });

    const fetchWithdrawals = async () => {
        try {
            setLoading(true);

            let query = supabase
                .from('withdrawals')
                .select(`
          *,
          tenants (name, owner_id, balance)
        `)
                .order('created_at', { ascending: false });

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;
            if (error) throw error;

            setWithdrawals(data || []);

            // Get stats
            const { data: allWithdrawals } = await supabase
                .from('withdrawals')
                .select('status, amount');

            if (allWithdrawals) {
                const pending = allWithdrawals.filter(w => w.status === 'pending');
                setStats({
                    pending: pending.length,
                    approved: allWithdrawals.filter(w => w.status === 'approved').length,
                    rejected: allWithdrawals.filter(w => w.status === 'rejected').length,
                    totalPending: pending.reduce((sum, w) => sum + w.amount, 0),
                });
            }
        } catch (error) {
            console.error('Error fetching withdrawals:', error);
            toast.error('Gagal memuat data penarikan');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWithdrawals();
    }, [statusFilter]);

    const handleAction = async () => {
        if (!selectedWithdrawal) return;

        setProcessing(true);
        try {
            if (actionType === 'approve') {
                // Call approve function
                const { error } = await supabase.rpc('approve_withdrawal', {
                    p_withdrawal_id: selectedWithdrawal.id,
                    p_admin_notes: adminNotes || null,
                });

                if (error) throw error;
                toast.success('Penarikan berhasil disetujui');
            } else {
                // Call reject function
                const { error } = await supabase.rpc('reject_withdrawal', {
                    p_withdrawal_id: selectedWithdrawal.id,
                    p_admin_notes: adminNotes || null,
                });

                if (error) throw error;
                toast.success('Penarikan berhasil ditolak');
            }

            setShowActionDialog(false);
            setSelectedWithdrawal(null);
            setAdminNotes('');
            fetchWithdrawals();
        } catch (error: any) {
            toast.error(error.message || 'Gagal memproses penarikan');
        } finally {
            setProcessing(false);
        }
    };

    const openActionDialog = (withdrawal: Withdrawal, action: 'approve' | 'reject') => {
        setSelectedWithdrawal(withdrawal);
        setActionType(action);
        setAdminNotes('');
        setShowActionDialog(true);
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

    const filteredWithdrawals = withdrawals.filter(w =>
        w.tenants?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.account_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.bank_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Memuat data penarikan...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">Penarikan Saldo</h1>
                <p className="text-muted-foreground">Kelola permintaan penarikan saldo seller</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Menunggu</p>
                            <p className="text-2xl font-bold">{stats.pending}</p>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Pending</p>
                            <p className="text-lg font-bold">Rp {stats.totalPending.toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Disetujui</p>
                            <p className="text-2xl font-bold">{stats.approved}</p>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                            <XCircle className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Ditolak</p>
                            <p className="text-2xl font-bold">{stats.rejected}</p>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari nama tenant, bank, atau rekening..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="min-w-[150px]">
                            <Filter className="w-4 h-4 mr-2" />
                            {statusFilter === 'all' ? 'Semua Status' : statusConfig[statusFilter as keyof typeof statusConfig]?.label}
                            <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                            Semua Status
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
                            <Clock className="w-4 h-4 mr-2 text-yellow-500" />
                            Menunggu
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter('approved')}>
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                            Disetujui
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter('rejected')}>
                            <XCircle className="w-4 h-4 mr-2 text-red-500" />
                            Ditolak
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Withdrawals List */}
            {filteredWithdrawals.length === 0 ? (
                <GlassCard className="p-12 text-center">
                    <ArrowDownCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">Tidak ada penarikan</h3>
                    <p className="text-muted-foreground">
                        {statusFilter === 'pending'
                            ? 'Tidak ada permintaan penarikan yang menunggu'
                            : 'Tidak ada data penarikan'}
                    </p>
                </GlassCard>
            ) : (
                <div className="space-y-4">
                    {filteredWithdrawals.map((withdrawal, index) => {
                        const status = statusConfig[withdrawal.status];
                        const StatusIcon = status.icon;

                        return (
                            <motion.div
                                key={withdrawal.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <GlassCard className="p-4">
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                        {/* Tenant Info */}
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                                <Building className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">{withdrawal.tenants?.name || 'Tenant'}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Saldo: Rp {(withdrawal.tenants?.balance || 0).toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-primary">
                                                Rp {withdrawal.amount.toLocaleString('id-ID')}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(withdrawal.created_at)}
                                            </p>
                                        </div>

                                        {/* Bank Info */}
                                        <div className="glass p-3 rounded-lg flex-1">
                                            <p className="font-medium">{withdrawal.bank_name}</p>
                                            <p className="text-sm text-muted-foreground">{withdrawal.account_number}</p>
                                            <p className="text-sm">{withdrawal.account_name}</p>
                                        </div>

                                        {/* Status & Actions */}
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${status.color}`}>
                                                <StatusIcon className="w-4 h-4" />
                                                {status.label}
                                            </span>

                                            {withdrawal.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-500 hover:bg-green-600"
                                                        onClick={() => openActionDialog(withdrawal, 'approve')}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        Setujui
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                                                        onClick={() => openActionDialog(withdrawal, 'reject')}
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                        Tolak
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {(withdrawal.notes || withdrawal.admin_notes) && (
                                        <div className="mt-3 pt-3 border-t border-white/10 text-sm">
                                            {withdrawal.notes && (
                                                <p className="text-muted-foreground">
                                                    <span className="font-medium">Catatan Seller:</span> {withdrawal.notes}
                                                </p>
                                            )}
                                            {withdrawal.admin_notes && (
                                                <p className="text-muted-foreground mt-1">
                                                    <span className="font-medium">Catatan Admin:</span> {withdrawal.admin_notes}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </GlassCard>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Action Dialog */}
            <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {actionType === 'approve' ? 'Setujui Penarikan' : 'Tolak Penarikan'}
                        </DialogTitle>
                        <DialogDescription>
                            {actionType === 'approve'
                                ? 'Saldo seller akan berkurang setelah disetujui'
                                : 'Berikan alasan penolakan'}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedWithdrawal && (
                        <div className="space-y-4">
                            <div className="glass p-4 rounded-xl">
                                <div className="flex justify-between mb-2">
                                    <span className="text-muted-foreground">Tenant</span>
                                    <span className="font-medium">{selectedWithdrawal.tenants?.name}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-muted-foreground">Jumlah</span>
                                    <span className="font-bold text-primary">
                                        Rp {selectedWithdrawal.amount.toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-muted-foreground">Bank</span>
                                    <span>{selectedWithdrawal.bank_name}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-muted-foreground">No. Rekening</span>
                                    <span>{selectedWithdrawal.account_number}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Nama Rekening</span>
                                    <span>{selectedWithdrawal.account_name}</span>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="admin_notes">Catatan Admin (Opsional)</Label>
                                <Textarea
                                    id="admin_notes"
                                    placeholder={actionType === 'approve' ? 'Catatan persetujuan...' : 'Alasan penolakan...'}
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    className="mt-1"
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowActionDialog(false)}
                                    disabled={processing}
                                >
                                    Batal
                                </Button>
                                <Button
                                    className={`flex-1 ${actionType === 'approve' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                                    onClick={handleAction}
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : actionType === 'approve' ? (
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                    ) : (
                                        <XCircle className="w-4 h-4 mr-2" />
                                    )}
                                    {actionType === 'approve' ? 'Setujui' : 'Tolak'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
