import React from 'react';
import Loader from './Loader';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all box-border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer select-none shrink-0 leading-tight';

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover shadow-xs active:scale-[0.98]',
    secondary: 'bg-primary-50 text-primary hover:bg-primary-100 active:scale-[0.98]',
    outline: 'border border-primary text-primary hover:bg-primary-50 active:scale-[0.98]',
    ghost: 'text-primary hover:bg-primary-50 active:scale-[0.98]',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 min-h-[34px]',
    md: 'text-sm px-4 py-2 min-h-[40px]',
    lg: 'text-base px-6 py-2.5 min-h-[46px]',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <Loader size="sm" />
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
