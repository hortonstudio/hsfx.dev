'use client';

import { forwardRef, type ReactNode, type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', children, className = '', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50';

    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'px-4 py-2 text-sm rounded-md gap-1.5',
      md: 'px-6 py-3 text-base rounded-lg gap-2',
      lg: 'px-8 py-4 text-lg rounded-lg gap-2.5',
    };

    const variantStyles: Record<ButtonVariant, string> = {
      primary: 'btn-gradient text-white',
      ghost: 'btn-ghost-glow bg-transparent text-text-secondary',
      outline: 'btn-outline-glow text-accent',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
