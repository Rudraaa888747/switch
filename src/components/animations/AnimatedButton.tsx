import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export const AnimatedButton = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  type = 'button',
  disabled = false,
}: AnimatedButtonProps) => {
  const baseStyles = 'relative overflow-hidden font-medium uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'bg-foreground text-background hover:opacity-90',
    outline: 'border border-foreground text-foreground hover:bg-foreground hover:text-background',
    ghost: 'text-foreground hover:opacity-60',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-xs',
    lg: 'px-8 py-4 text-sm',
  };

  return (
    <motion.button
      type={type}
      disabled={disabled}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
    >
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
        whileHover={{ translateX: '200%' }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />
      
      {/* Content */}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};

// Ripple button effect
export const RippleButton = ({
  children,
  className,
  onClick,
  type = 'button',
  disabled = false,
}: AnimatedButtonProps) => {
  const handleClick = () => {
    onClick?.();
  };

  return (
    <motion.button
      type={type}
      disabled={disabled}
      className={cn(
        'relative overflow-hidden font-medium uppercase tracking-widest transition-all duration-300',
        className
      )}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={handleClick}
    >
      {children}
    </motion.button>
  );
};
