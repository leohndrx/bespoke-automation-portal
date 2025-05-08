'use client';

import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      ...props
    },
    ref
  ) => {
    // Map destructive to danger for backward compatibility
    if (variant === 'destructive') {
      variant = 'danger';
    }

    // Define styles using our new color palette
    const variants = {
      primary:
        'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark/90 border border-transparent',
      secondary:
        'bg-secondary text-white hover:bg-secondary/90 active:bg-secondary/80 border border-transparent',
      outline:
        'bg-transparent text-foreground hover:bg-muted active:bg-muted/80 border border-input',
      ghost:
        'bg-transparent text-foreground hover:bg-muted active:bg-muted/80 border-none',
      danger:
        'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 border border-transparent',
    };

    const sizes = {
      sm: 'text-xs py-1.5 px-3 rounded-lg h-8',
      md: 'text-sm py-2 px-4 rounded-lg h-10',
      lg: 'text-sm py-2.5 px-5 rounded-lg h-11',
    };

    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center font-medium transition-all duration-200 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
          'disabled:opacity-60 disabled:pointer-events-none',
          variants[variant as keyof typeof variants],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            width="16"
            height="16"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {!isLoading && leftIcon && (
          <span className="mr-2 flex items-center">
            {leftIcon}
          </span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="ml-2 flex items-center">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button'; 