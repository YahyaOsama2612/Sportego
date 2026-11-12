import React from 'react';

const Loader = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3 border-2',
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const isSmall = size === 'sm' || size === 'xs';

  return (
    <div
      className={`${
        isSmall ? 'inline-flex p-0 leading-none' : 'flex p-3'
      } items-center justify-center shrink-0 ${className}`}
    >
      <div
        className={`${
          sizeClasses[size] || sizeClasses.md
        } border-current/25 border-t-current rounded-full animate-spin shrink-0`}
        role="status"
        aria-label="loading"
      />
    </div>
  );
};

export default Loader;
