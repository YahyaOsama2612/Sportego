import React from 'react';

const StatusBadge = ({ status = 'active', label }) => {
  const normalized = String(status).toLowerCase();

  const statusStyles = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    grace: 'bg-orange-50 text-orange-700 border-orange-200',
    expired: 'bg-red-50 text-red-700 border-red-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
    inactive: 'bg-gray-100 text-gray-600 border-gray-200',
    refunded: 'bg-primary-50 text-primary border-primary-200',
    purple: 'bg-primary-50 text-primary border-primary-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
        statusStyles[normalized] || statusStyles.purple
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {label || status}
    </span>
  );
};

export default StatusBadge;
