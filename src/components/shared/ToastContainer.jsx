import React from 'react';

const ToastContainer = ({ toasts = [], onDismiss }) => {
  if (!toasts.length) return null;

  const typeConfig = {
    error: {
      bgColor: 'bg-white border-l-4 border-l-red-500 border-gray-100 text-gray-900',
      iconColor: 'text-red-500',
      iconBg: 'bg-red-50',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    success: {
      bgColor: 'bg-white border-l-4 border-l-emerald-500 border-gray-100 text-gray-900',
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-50',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    warning: {
      bgColor: 'bg-white border-l-4 border-l-amber-500 border-gray-100 text-gray-900',
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-50',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    info: {
      bgColor: 'bg-white border-l-4 border-l-primary border-gray-100 text-gray-900',
      iconColor: 'text-primary',
      iconBg: 'bg-primary-50',
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const formatMessage = (msg) => {
    if (typeof msg === 'string') return msg;
    if (!msg) return '';
    if (typeof msg === 'object') {
      return msg.message || msg.error || JSON.stringify(msg);
    }
    return String(msg);
  };

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const conf = typeConfig[toast.type] || typeConfig.info;
        const messageText = formatMessage(toast.message);
        const isHidden = toast.isEntering || toast.isExiting;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transform transition-all duration-300 ease-out ${
              isHidden
                ? 'translate-x-12 opacity-0 scale-95'
                : 'translate-x-0 opacity-100 scale-100'
            } ${conf.bgColor}`}
          >
            <div className="flex items-start gap-3">
              <span className={`p-1.5 rounded-lg ${conf.iconBg} ${conf.iconColor}`}>
                {conf.icon}
              </span>
              <div className="pt-0.5">
                {toast.title && (
                  <h4 className="font-bold text-xs text-gray-900 mb-0.5">{toast.title}</h4>
                )}
                <p className="text-xs text-gray-600 leading-relaxed font-medium">{messageText}</p>
              </div>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-gray-400 hover:text-gray-600 rounded-lg p-1 transition-colors cursor-pointer"
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
