import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
}

export const LoadingSkeleton = ({ className }: LoadingSkeletonProps) => {
  return (
    <div
      className={cn(
        'animate-shimmer bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:1000px_100%] rounded-lg',
        className
      )}
      style={{
        backgroundImage:
          'linear-gradient(90deg, hsl(220 15% 18%) 0%, hsl(220 20% 25%) 50%, hsl(220 15% 18%) 100%)',
      }}
    />
  );
};

export const ProductCardSkeleton = () => {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <LoadingSkeleton className="w-full h-48" />
      <div className="p-4 space-y-3">
        <LoadingSkeleton className="h-5 w-3/4" />
        <LoadingSkeleton className="h-4 w-full" />
        <LoadingSkeleton className="h-6 w-1/3" />
      </div>
    </div>
  );
};
