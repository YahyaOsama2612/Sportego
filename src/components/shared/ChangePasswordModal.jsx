import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from './Button';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { changePassword } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showWarning('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      showWarning('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await changePassword({
        currentPassword,
        newPassword,
      });
      showSuccess('Password updated successfully!');
      onClose();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      // The backend error toast is triggered automatically by the axios interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-gray-100">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Enter current password"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Confirm new password"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
