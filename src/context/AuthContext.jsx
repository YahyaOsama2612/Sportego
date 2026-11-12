import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import useGet from '../hooks/useGet';
import usePost from '../hooks/usePost';
import usePut from '../hooks/usePut';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    try {
      const savedAdmin = localStorage.getItem('admin');
      return savedAdmin ? JSON.parse(savedAdmin) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Custom HTTP Hooks for Authentication
  const { execute: getMeApi } = useGet('/api/auth/me', { immediate: false });
  const { execute: loginApi } = usePost('/api/auth/login');
  const { execute: logoutApi } = usePost('/api/auth/logout');
  const { execute: changePasswordApi } = usePut('/api/auth/change-password');

  // Fetch current admin profile from GET /api/auth/me using useGet
  const fetchMe = useCallback(async () => {
    try {
      const res = await getMeApi();
      const adminData = res?.data?.admin || res?.admin || res?.data;
      if (adminData) {
        setAdmin(adminData);
        localStorage.setItem('admin', JSON.stringify(adminData));
      }
      return adminData;
    } catch (err) {
      console.warn('Failed to fetch authenticated admin profile:', err?.message);
      if (err?.response?.status === 401) {
        logout();
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [getMeApi]);

  // Initial check on mount
  useEffect(() => {
    const currentToken = localStorage.getItem('token');
    if (currentToken) {
      setToken(currentToken);
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [fetchMe]);

  /**
   * Login handler using usePost hook
   * POST /api/auth/login { email, password }
   */
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await loginApi({ email, password });

      // Extract token
      const authToken = response?.token || response?.data?.token || response?.data?.accessToken;
      if (authToken) {
        localStorage.setItem('token', authToken);
        setToken(authToken);
      }

      // If response already includes admin profile, save it
      const adminData = response?.data?.admin || response?.admin;
      if (adminData) {
        setAdmin(adminData);
        localStorage.setItem('admin', JSON.stringify(adminData));
      } else {
        await fetchMe();
      }

      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout handler using usePost hook
   * POST /api/auth/logout
   */
  const logout = async () => {
    try {
      await logoutApi().catch(() => {});
    } catch {
      // Ignored
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('admin');
      setToken(null);
      setAdmin(null);
    }
  };

  /**
   * Change Password handler using usePut hook
   * PUT /api/auth/change-password
   */
  const changePassword = async (passwords) => {
    return await changePasswordApi(passwords);
  };

  const value = {
    admin,
    token,
    isAuthenticated: Boolean(token),
    loading,
    login,
    logout,
    changePassword,
    fetchMe,
    setAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
