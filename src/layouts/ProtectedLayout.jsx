import { useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/shared/Header';
import Sidebar from '../components/shared/Sidebar';
import Loader from '../components/shared/Loader';
import Button from '../components/shared/Button';
import ChangePasswordModal from '../components/shared/ChangePasswordModal';

const routeMeta = {
  '/': { title: 'Dashboard', breadcrumbs: ['Home', 'Dashboard'] },
  '/clubs': { title: 'Clubs', breadcrumbs: ['Home', 'Clubs'] },
  '/games': { title: 'Games & Sports', breadcrumbs: ['Home', 'Games & Sports'] },
  '/actions': { title: 'Actions', breadcrumbs: ['Home', 'Actions'] },
  '/packages': { title: 'Subscription Packages', breadcrumbs: ['Home', 'Packages & Plans'] },
  '/payment-methods': { title: 'Payment Gateways & Methods', breadcrumbs: ['Home', 'Payment Methods'] },
  '/teams': { title: 'Teams & Rosters', breadcrumbs: ['Home', 'Teams & Players'] },
  '/matches': { title: 'Matches & Fixtures', breadcrumbs: ['Home', 'Matches & Fixtures'] },
  '/orders': { title: 'Orders & Invoices', breadcrumbs: ['Home', 'Orders & Invoices'] },
  '/analytics': { title: 'Analytics', breadcrumbs: ['Home', 'Analytics'] },
  '/settings': { title: 'Settings', breadcrumbs: ['Home', 'Settings'] },
};

const ProtectedLayout = ({ children }) => {
  const { admin, isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sportego_sidebar_collapsed') === 'true';
  });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  // 1. Initial authentication loading state
  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white font-bold text-2xl shadow-lg mb-4">
          S
        </div>
        <Loader size="lg" />
        <p className="mt-4 text-sm font-medium text-gray-500">Loading workspace...</p>
      </div>
    );
  }

  // 2. Unauthenticated redirect to /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const currentMeta = routeMeta[location.pathname] || {
    title: 'Dashboard',
    breadcrumbs: ['Home', 'Overview'],
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Unified single toggle for both mobile drawer and desktop collapse
  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      setIsCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem('sportego_sidebar_collapsed', String(next));
        return next;
      });
    } else {
      setSidebarOpen((prev) => !prev);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Shared Collapsible Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Shared Header */}
        <Header
          title={currentMeta.title}
          breadcrumbs={currentMeta.breadcrumbs}
          onMenuToggle={handleToggle}
          user={{
            name: admin?.name || 'Administrator',
            email: admin?.email || '',
            role: admin?.role || 'Admin',
          }}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPasswordModalOpen(true)}
                className="hidden sm:inline-flex text-xs font-semibold"
              >
                Change Password
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-xs font-semibold hover:border-red-500 hover:text-red-600 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          }
        />

        {/* Status Banner */}
        <div className="bg-primary/5 border-b border-primary/10 px-6 py-2 flex items-center justify-between text-xs text-primary">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Signed in as <strong className="font-semibold">{admin?.name || 'Administrator'}</strong>
            </span>
          </div>
          {admin?.last_login_at && (
            <span className="hidden sm:inline text-gray-500">
              Last login: {new Date(admin.last_login_at).toLocaleString()}
            </span>
          )}
        </div>

        {/* Content View */}
        <main className="flex-1 overflow-y-auto">
          {children || <Outlet />}
        </main>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};

export default ProtectedLayout;
