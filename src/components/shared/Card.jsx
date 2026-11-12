import React from 'react';

const Card = ({ title, subtitle, children, footer, className = '', ...props }) => {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 ${className}`}
      {...props}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      )}
      <div>{children}</div>
      {footer && <div className="mt-4 pt-4 border-t border-gray-100">{footer}</div>}
    </div>
  );
};

export default Card;

