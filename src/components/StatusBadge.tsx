import { OrderStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Clock, Package, CheckCircle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const statusConfig = {
  pending: {
    label: 'Menunggu',
    icon: Clock,
    className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  },
  processing: {
    label: 'Diproses',
    icon: Package,
    className: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  completed: {
    label: 'Selesai',
    icon: CheckCircle,
    className: 'bg-green-500/20 text-green-300 border-green-500/30',
  },
  cancelled: {
    label: 'Dibatalkan',
    icon: XCircle,
    className: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm',
        config.className,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </div>
  );
};
