import React, { useState, useEffect, useMemo } from 'react';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Loader from '../components/shared/Loader';
import ChangePasswordModal from '../components/shared/ChangePasswordModal';
import useGet from '../hooks/useGet';
import usePut from '../hooks/usePut';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Currency formatter
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const Settings = () => {
  const { admin } = useAuth();
  const { showSuccess, showError } = useToast();

  // 1. Hook for GET /api/settings
  const {
    data: responseData,
    loading: isLoading,
    refetch,
  } = useGet('/api/settings', { immediate: true });

  // 2. Hook for PUT /api/settings
  const { execute: putSettings, loading: isSaving } = usePut('/api/settings');

  // Extract settings object safely from response wrapper
  const settings = useMemo(() => {
    return (
      responseData?.data?.settings ||
      responseData?.settings ||
      responseData?.data ||
      null
    );
  }, [responseData]);

  // Form State
  const [formData, setFormData] = useState({
    allowed_days: 12,
    notification: true,
    fines: 500,
  });

  // Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Sync state when GET response is received
  useEffect(() => {
    if (settings) {
      setFormData({
        allowed_days: settings.allowed_days ?? 12,
        notification: Boolean(settings.notification),
        fines: settings.fines ?? 500,
      });
    }
  }, [settings]);

  // Check if form has unsaved modifications
  const hasChanges = useMemo(() => {
    if (!settings) return false;
    return (
      Number(formData.allowed_days) !== Number(settings.allowed_days) ||
      Boolean(formData.notification) !== Boolean(settings.notification) ||
      Number(formData.fines) !== Number(settings.fines)
    );
  }, [formData, settings]);

  // Reset to original values
  const handleReset = () => {
    if (settings) {
      setFormData({
        allowed_days: settings.allowed_days ?? 12,
        notification: Boolean(settings.notification),
        fines: settings.fines ?? 500,
      });
    }
  };

  // Form Submit: PUT /api/settings
  const handleSubmit = async (e) => {
    e.preventDefault();

    const allowedDaysNum = parseInt(formData.allowed_days, 10);
    if (isNaN(allowedDaysNum) || allowedDaysNum < 0) {
      showError('Allowed days must be a non-negative number.');
      return;
    }

    const finesNum = parseFloat(formData.fines);
    if (isNaN(finesNum) || finesNum < 0) {
      showError('Fines amount must be a non-negative value.');
      return;
    }

    const payload = {
      allowed_days: allowedDaysNum,
      notification: Boolean(formData.notification), // strict boolean
      fines: finesNum,
    };

    try {
      await putSettings(payload);
      showSuccess('System settings updated successfully!');
      refetch();
    } catch {
      // Backend error toast is handled globally and automatically by axios interceptor
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-5xl">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-primary via-purple-700 to-indigo-800 p-6 sm:p-8 text-white shadow-xl shadow-primary/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur">
                Platform Preferences
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                ● Global Scope
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              System Settings & Rules
            </h2>
            <p className="mt-1 text-purple-100 text-sm max-w-xl leading-relaxed">
              Configure grace periods, financial penalty fines, and automated notifications across Sportego.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => refetch()}
              disabled={isLoading}
              className="bg-white/10 text-white hover:bg-white/20 border border-white/20"
            >
              {isLoading ? 'Refreshing...' : '↻ Refresh'}
            </Button>
          </div>
        </div>
      </div>

      {isLoading && !settings ? (
        <Card>
          <div className="py-16 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-sm font-medium text-gray-500">Loading system settings...</p>
          </div>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Global Configuration Settings */}
          <Card
            title="Global Configuration Rules"
            subtitle="Operational rules applied to all clubs, matches, and system workflows."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
              {/* Allowed Days */}
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="allowed_days"
                    className="text-xs font-bold text-gray-700 uppercase tracking-wider block"
                  >
                    Allowed Grace Window (Days) *
                  </label>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 text-primary">
                    {formData.allowed_days} Days
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  The grace period or buffer days permitted before subscription expiration, order cancellation, or roster locking.
                </p>
                <div className="relative mt-2">
                  <input
                    id="allowed_days"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.allowed_days}
                    onChange={(e) =>
                      setFormData({ ...formData, allowed_days: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-xs"
                    placeholder="e.g. 14"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs text-gray-400 font-medium">
                    Days
                  </div>
                </div>
              </div>

              {/* Fines */}
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="fines"
                    className="text-xs font-bold text-gray-700 uppercase tracking-wider block"
                  >
                    Penalty & Late Fines (EGP) *
                  </label>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {formatCurrency(formData.fines)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Default penalty fine fee assessed for late renewals, match infringements, or payment delays.
                </p>
                <div className="relative mt-2">
                  <input
                    id="fines"
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={formData.fines}
                    onChange={(e) =>
                      setFormData({ ...formData, fines: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-xs"
                    placeholder="e.g. 500"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs text-gray-400 font-medium">
                    EGP
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Toggle Row */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">
                      System Notification Alerts
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        formData.notification
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                    >
                      ● {formData.notification ? 'Active' : 'Muted'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 max-w-xl">
                    Dispatch automated email alerts and in-app notifications for club order updates, billing cycles, and system events.
                  </p>
                </div>

                {/* Modern Switch */}
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.notification}
                    onChange={(e) =>
                      setFormData({ ...formData, notification: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6.5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5.5 after:w-5.5 after:transition-all peer-checked:bg-primary shadow-inner" />
                </label>
              </div>
            </div>
          </Card>

          {/* Audit & Configuration Metadata */}
          {settings && (
            <Card title="Configuration Audit & Status">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2 text-sm">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">
                    Configuration Scope
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-purple-50 text-primary border border-purple-200">
                    {settings.key || 'Global'}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">
                    Last Updated
                  </span>
                  <p className="text-xs font-bold text-gray-800">
                    {settings.updatedAt
                      ? new Date(settings.updatedAt).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase block mb-1">
                    Created Date
                  </span>
                  <p className="text-xs font-bold text-gray-800">
                    {settings.createdAt
                      ? new Date(settings.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Administrator Profile & Security */}
          <Card
            title="Administrator Credentials"
            subtitle="Current authenticated administrator managing these platform rules."
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-purple-100 text-primary font-black flex items-center justify-center text-lg shadow-xs">
                  {admin?.name?.charAt(0) || 'A'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900">{admin?.name || 'Super Admin'}</p>
                    <span className="px-2 py-0.5 bg-primary-50 text-primary rounded text-xs font-semibold border border-primary-100">
                      {admin?.role || 'Admin'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{admin?.email || 'admin@sportego.org'}</p>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsPasswordModalOpen(true)}
                className="text-xs font-semibold"
              >
                Change Admin Password
              </Button>
            </div>
          </Card>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {hasChanges && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved configuration changes detected
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={!hasChanges || isSaving}
                onClick={handleReset}
              >
                Reset
              </Button>

              <Button
                type="submit"
                variant="primary"
                disabled={isSaving || !hasChanges}
                className="shadow-md"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Loader size="sm" />
                    Saving Settings...
                  </span>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};

export default Settings;
