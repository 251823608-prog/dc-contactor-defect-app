import { cn } from '../../lib/utils';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'icon';
}

const variants = {
  default: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
  ghost: 'hover:bg-slate-100 text-slate-600',
  outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
};

const sizes = {
  sm: 'h-7 px-2.5 text-xs rounded-md gap-1',
  md: 'h-9 px-3.5 text-sm rounded-lg gap-1.5',
  icon: 'h-8 w-8 p-0 rounded-md justify-center',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
export { Button };
export type { ButtonProps };
