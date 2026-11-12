import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedLayout from '../layouts/ProtectedLayout';
import Home from '../pages/Home';
import Games from '../pages/Games';
import Packages from '../pages/Packages';
import PaymentMethods from '../pages/PaymentMethods';
import Teams from '../pages/Teams';
import Matches from '../pages/Matches';
import Analytics from '../pages/Analytics';
import Settings from '../pages/Settings';
import Orders from '../pages/Orders';
import Clubs from '../pages/Clubs';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import Actions from '../pages/Actions';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes (Enclosed by ProtectedLayout) */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/clubs" element={<Clubs />} />
        <Route path="/games" element={<Games />} />
        <Route path="/actions" element={<Actions />} />
        <Route path="/packages" element={<Packages />} />
        <Route path="/payment-methods" element={<PaymentMethods />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
      </Route>

      {/* Fallback 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
