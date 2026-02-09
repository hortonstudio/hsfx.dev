'use client';

import { motion, type HTMLMotionProps, type TargetAndTransition } from 'framer-motion';
import { forwardRef, type ReactNode } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', children, className = '', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50';

    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'px-4 py-2 text-sm rounded-md gap-1.5',
      md: 'px-6 py-3 text-base rounded-lg gap-2',
      lg: 'px-8 py-4 text-lg rounded-lg gap-2.5',
    };

    const variantStyles: Record<ButtonVariant, string> = {
      primary: 'bg-accent text-white',
      ghost: 'bg-transparent text-text-secondary',
      outline: 'bg-transparent border border-accent text-accent',
    };

    const hoverAnimations: Record<ButtonVariant, TargetAndTransition> = {
      primary: {
        scale: 1.02,
        boxShadow: '0 0 20px rgba(74, 158, 255, 0.25), 0 0 40px rgba(74, 158, 255, 0.1)',
      },
      ghost: {
        scale: 1.02,
        backgroundColor: 'rgba(74, 158, 255, 0.05)',
        color: 'var(--text-primary)',
      },
      outline: {
        scale: 1.02,
        boxShadow: '0 0 15px rgba(74, 158, 255, 0.2)',
        backgroundColor: 'rgba(74, 158, 255, 0.08)',
      },
    };

    const tapAnimations: Record<ButtonVariant, TargetAndTransition> = {
      primary: {
        scale: 0.98,
        boxShadow: '0 0 10px rgba(74, 158, 255, 0.3)',
      },
      ghost: {
        scale: 0.98,
        backgroundColor: 'rgba(74, 158, 255, 0.08)',
      },
      outline: {
        scale: 0.98,
        boxShadow: '0 0 8px rgba(74, 158, 255, 0.25)',
      },
    };

    return (
      <motion.button
        ref={ref}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        initial={{
          boxShadow: '0 0 0 rgba(74, 158, 255, 0)',
        }}
        whileHover={hoverAnimations[variant]}
        whileTap={tapAnimations[variant]}
        transition={{
          duration: 0.2,
          ease: 'easeOut',
        }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
