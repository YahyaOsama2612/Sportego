import { useNavigate, useLocation } from 'react-router-dom';

const defaultMenuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'clubs',
    label: 'Clubs',
    path: '/clubs',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21h18M5 21V7l8-4v18m6 0V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01m8-5v.01m0 3v.01" />
      </svg>
    ),
  },
  {
    id: 'games',
    label: 'Games & Sports',
    path: '/games',

    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'actions',
    label: 'Actions',
    path: '/actions',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 'packages',
    label: 'Packages & Pricing',
    path: '/packages',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: 'payment-methods',
    label: 'Payment Methods',
    path: '/payment-methods',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
 
  {
    id: 'orders',
    label: 'Orders & Invoices',
    path: '/orders',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  
  {
    id: 'settings',
    label: 'Settings',
    path: '/settings',
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const Sidebar = ({
  isOpen = false,
  onClose,
  isCollapsed = false,
  brand = { name: 'Sportego', logoText: 'S' },
  items = defaultMenuItems,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-gray-200 bg-white transition-all duration-300 ease-in-out lg:static ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
          } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}
      >
        {/* Brand Header with prominent, centered 'S' logo */}
        <div className={`flex h-16 items-center border-b border-gray-100 ${isCollapsed ? 'justify-center px-0' : 'px-5'
          }`}>
          <div
            className={`flex items-center cursor-pointer select-none ${isCollapsed ? 'justify-center w-full' : 'gap-3'
              }`}
            onClick={() => navigate('/')}
            title={brand.name}
          >
            {/* The 'S' Letter Logo Box */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white font-black text-xl shadow-md shadow-primary/20 transition-transform hover:scale-105">
              {brand.logoText}
            </div>

            {/* Brand Title (hidden when collapsed) */}
            {!isCollapsed && (
              <div className="overflow-hidden whitespace-nowrap">
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent leading-none">
                  {brand.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className={`flex-1 overflow-hidden py-4 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          <nav className="space-y-1.5">
            {items.map((item) => {
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);

              return (
                <div key={item.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => {
                      navigate(item.path);
                      if (onClose) onClose();
                    }}
                    className={`flex w-full items-center rounded-xl transition-all cursor-pointer ${isCollapsed
                        ? 'justify-center p-3'
                        : 'justify-between px-3.5 py-2.5 text-sm font-medium'
                      } ${isActive
                        ? 'bg-primary text-white font-semibold shadow-sm'
                        : 'text-gray-600 hover:bg-primary hover:text-white'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                          }`}
                      >
                        {item.icon}
                      </span>
                      {!isCollapsed && (
                        <span className="transition-colors">{item.label}</span>
                      )}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold transition-colors ${isActive
                            ? 'bg-white text-primary font-bold'
                            : 'bg-primary-100 text-primary group-hover:bg-white group-hover:text-primary'
                          }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Indicator dot when collapsed */}
                    {isCollapsed && item.badge && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary group-hover:bg-white ring-2 ring-white" />
                    )}
                  </button>

                  {/* Tooltip on hover when collapsed */}
                  {isCollapsed && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                      {item.label}
                      {item.badge && (
                        <span className="ml-1.5 px-1.5 py-0.5 bg-primary rounded text-[10px] font-bold">
                          {item.badge}
                        </span>
                      )}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;
