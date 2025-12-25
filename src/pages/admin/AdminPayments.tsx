import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CreditCard, 
  Banknote, 
  QrCode,
  Building2,
  Search,
  Check,
  X
} from 'lucide-react';

interface PaymentMethodConfig {
  id: string;
  name: string;
  code: 'cash' | 'qris' | 'transfer';
  description: string;
  icon: 'cash' | 'qris' | 'bank';
  isActive: boolean;
  instructions: string;
  // For bank transfer
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  // For QRIS
  qrisImage?: string;
  createdAt: string;
}

const initialPaymentMethods: PaymentMethodConfig[] = [
  {
    id: 'pm1',
    name: 'Cash Payment',
    code: 'cash',
    description: 'Pay with cash at the counter',
    icon: 'cash',
    isActive: true,
    instructions: 'Please pay at the cashier counter when your order is ready.',
    createdAt: '2024-01-01',
  },
  {
    id: 'pm2',
    name: 'QRIS Payment',
    code: 'qris',
    description: 'Scan QR code to pay',
    icon: 'qris',
    isActive: true,
    instructions: 'Scan the QR code using your mobile banking or e-wallet app.',
    qrisImage: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=DIGIBITE-QRIS-PAYMENT',
    createdAt: '2024-01-01',
  },
  {
    id: 'pm3',
    name: 'Bank Transfer',
    code: 'transfer',
    description: 'Transfer to our bank account',
    icon: 'bank',
    isActive: true,
    instructions: 'Transfer the exact amount to the bank account below.',
    bankName: 'BCA',
    accountNumber: '1234567890',
    accountName: 'PT Digibite Indonesia',
    createdAt: '2024-01-01',
  },
];

export function AdminPayments() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(initialPaymentMethods);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodConfig | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: 'cash' as 'cash' | 'qris' | 'transfer',
    description: '',
    instructions: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    qrisImage: '',
  });

  const filteredMethods = paymentMethods.filter(method =>
    method.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    method.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIcon = (icon: string) => {
    switch (icon) {
      case 'cash': return <Banknote className="w-5 h-5" />;
      case 'qris': return <QrCode className="w-5 h-5" />;
      case 'bank': return <Building2 className="w-5 h-5" />;
      default: return <CreditCard className="w-5 h-5" />;
    }
  };

  const handleOpenDialog = (method?: PaymentMethodConfig) => {
    if (method) {
      setEditingMethod(method);
      setFormData({
        name: method.name,
        code: method.code,
        description: method.description,
        instructions: method.instructions,
        bankName: method.bankName || '',
        accountNumber: method.accountNumber || '',
        accountName: method.accountName || '',
        qrisImage: method.qrisImage || '',
      });
    } else {
      setEditingMethod(null);
      setFormData({
        name: '',
        code: 'cash',
        description: '',
        instructions: '',
        bankName: '',
        accountNumber: '',
        accountName: '',
        qrisImage: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.description) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (editingMethod) {
      setPaymentMethods(paymentMethods.map(method =>
        method.id === editingMethod.id
          ? {
              ...method,
              name: formData.name,
              code: formData.code,
              description: formData.description,
              instructions: formData.instructions,
              icon: formData.code === 'cash' ? 'cash' : formData.code === 'qris' ? 'qris' : 'bank',
              bankName: formData.bankName,
              accountNumber: formData.accountNumber,
              accountName: formData.accountName,
              qrisImage: formData.qrisImage,
            }
          : method
      ));
      toast({
        title: 'Success',
        description: 'Payment method updated successfully',
      });
    } else {
      const newMethod: PaymentMethodConfig = {
        id: `pm${Date.now()}`,
        name: formData.name,
        code: formData.code,
        description: formData.description,
        icon: formData.code === 'cash' ? 'cash' : formData.code === 'qris' ? 'qris' : 'bank',
        isActive: true,
        instructions: formData.instructions,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountName: formData.accountName,
        qrisImage: formData.qrisImage,
        createdAt: new Date().toISOString(),
      };
      setPaymentMethods([...paymentMethods, newMethod]);
      toast({
        title: 'Success',
        description: 'Payment method added successfully',
      });
    }
    setDialogOpen(false);
  };

  const handleToggleActive = (id: string) => {
    setPaymentMethods(paymentMethods.map(method =>
      method.id === id ? { ...method, isActive: !method.isActive } : method
    ));
    const method = paymentMethods.find(m => m.id === id);
    toast({
      title: method?.isActive ? 'Deactivated' : 'Activated',
      description: `${method?.name} has been ${method?.isActive ? 'deactivated' : 'activated'}`,
    });
  };

  const handleDelete = (id: string) => {
    setPaymentMethods(paymentMethods.filter(method => method.id !== id));
    toast({
      title: 'Deleted',
      description: 'Payment method deleted successfully',
    });
  };

  const stats = {
    total: paymentMethods.length,
    active: paymentMethods.filter(m => m.isActive).length,
    inactive: paymentMethods.filter(m => !m.isActive).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Payment Methods</h1>
          <p className="text-muted-foreground">Manage payment options for customers</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Payment Method
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Methods</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Check className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <X className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inactive</p>
              <p className="text-2xl font-bold">{stats.inactive}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Search */}
      <GlassCard className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search payment methods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </GlassCard>

      {/* Payment Methods Table */}
      <GlassCard className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Method</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMethods.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <CreditCard className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground">No payment methods found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredMethods.map((method, index) => (
                <motion.tr
                  key={method.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {getIcon(method.icon)}
                      </div>
                      <span className="font-medium">{method.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted">
                      {method.code.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{method.description}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={method.isActive}
                        onCheckedChange={() => handleToggleActive(method.id)}
                      />
                      <span className={method.isActive ? 'text-green-500' : 'text-muted-foreground'}>
                        {method.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(method)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(method.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </GlassCard>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
            </DialogTitle>
            <DialogDescription>
              {editingMethod ? 'Update payment method details' : 'Create a new payment method'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Method Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Bank Transfer BCA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Payment Type *</Label>
              <select
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value as 'cash' | 'qris' | 'transfer' })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="cash">Cash</option>
                <option value="qris">QRIS</option>
                <option value="transfer">Bank Transfer</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the payment method"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="Instructions for customers"
                rows={3}
              />
            </div>

            {formData.code === 'transfer' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="e.g., BCA, Mandiri, BNI"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="e.g., 1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    value={formData.accountName}
                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    placeholder="e.g., PT Digibite Indonesia"
                  />
                </div>
              </>
            )}

            {formData.code === 'qris' && (
              <div className="space-y-2">
                <Label htmlFor="qrisImage">QRIS Image URL</Label>
                <Input
                  id="qrisImage"
                  value={formData.qrisImage}
                  onChange={(e) => setFormData({ ...formData, qrisImage: e.target.value })}
                  placeholder="URL of QRIS code image"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingMethod ? 'Update' : 'Add Method'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
