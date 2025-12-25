import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'strong' | 'subtle';
}

export const GlassCard = ({
  children,
  className,
  hover = true,
  glow = false,
  onClick,
  variant = 'default'
}: GlassCardProps) => {
  const variants = {
    default: 'liquid-glass-card',
    strong: 'liquid-glass-strong',
    subtle: 'liquid-glass'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : {}}
      onClick={onClick}
      className={cn(
        variants[variant],
        'rounded-2xl p-4 sm:p-5 transition-smooth',
        glow && 'glow-soft',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </motion.div>
  );
};
