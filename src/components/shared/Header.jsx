import React from 'react';

const Header = ({
  title = 'Dashboard',
  breadcrumbs = [],
  onMenuToggle,
  user = { name: 'Admin', email: '', avatar: null },
  actions,
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/90 px-4 sm:px-6 backdrop-blur transition-all">
      {/* Left: Mobile Toggle & Page Title / Breadcrumbs */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            aria-label="Toggle Sidebar"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <div>
          {breadcrumbs.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-0.5">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span>/</span>}
                  <span className={idx === breadcrumbs.length - 1 ? 'text-primary font-medium' : ''}>
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </div>
          )}
          <h1 className="text-lg font-bold text-gray-900 tracking-tight sm:text-xl">{title}</h1>
        </div>
      </div>

      {/* Middle/Right: Search Bar & Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Custom Actions Slot */}
        {actions}

        <div className="h-6 w-px bg-gray-200 hidden sm:block" />

        {/* User Avatar */}
        <div className="flex items-center gap-3 cursor-pointer group">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="h-9 w-9 rounded-full object-cover ring-2 ring-primary/20" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-primary-100 text-primary font-semibold flex items-center justify-center text-sm ring-2 ring-primary/20 group-hover:ring-primary transition-all">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <div className="hidden lg:block text-left">
            <div className="text-sm font-semibold text-gray-800 leading-tight group-hover:text-primary transition-colors">
              {user.name}
            </div>
            <div className="text-xs text-gray-400">{user.email}</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
