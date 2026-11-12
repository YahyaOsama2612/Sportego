import React, { useState, useMemo, useRef } from 'react';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import GenericTable from '../components/shared/GenericTable';
import StatusBadge from '../components/others/StatusBadge';
import Loader from '../components/shared/Loader';
import useGet from '../hooks/useGet';
import usePost from '../hooks/usePost';
import usePut from '../hooks/usePut';
import usePatch from '../hooks/usePatch';
import useDelete from '../hooks/useDelete';
import { useToast } from '../context/ToastContext';

const PaymentMethods = () => {
  const { showSuccess, showError } = useToast();
  const fileInputRef = useRef(null);

  // Filter & Query Parameters State
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'true' | 'false'
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Query Params for GET /api/payment-methods (search is handled directly by GenericTable)
  const queryParams = useMemo(() => {
    const params = {
      page: 1,
      limit: 100,
      sort_by: sortBy,
      order: sortOrder,
    };
    if (statusFilter !== 'all') {
      params.status = statusFilter === 'true';
    }
    return params;
  }, [statusFilter, sortBy, sortOrder]);

  // 1. Hook for GET /api/payment-methods
  const {
    data: methodsData,
    loading: isLoading,
    refetch: refetchMethods,
  } = useGet('/api/payment-methods', {
    params: queryParams,
    immediate: true,
  });

  // 2. Hook for POST /api/payment-methods
  const { execute: postMethod, loading: isPosting } = usePost('/api/payment-methods');

  // 3. Hook for PUT /api/payment-methods/{id}
  const { execute: putMethod, loading: isPutting } = usePut();

  // 4. Hook for PATCH /api/payment-methods/{id}
  const { execute: patchMethod } = usePatch();

  // 5. Hook for DELETE /api/payment-methods/{id}
  const { execute: deleteMethod, loading: isDeleting } = useDelete();

  // 6. Hook for GET /api/payment-methods/{id} (Single item inspection)
  const [viewingMethod, setViewingMethod] = useState(null);
  const viewingId = viewingMethod?._id || null;
  const { data: singleResponse, loading: isSingleLoading } = useGet(
    viewingId ? `/api/payment-methods/${viewingId}` : '',
    { immediate: Boolean(viewingId) }
  );

  // Extract items safely
  const paymentMethods = useMemo(() => {
    return methodsData?.data?.items || methodsData?.items || [];
  }, [methodsData]);

  // Active method details resolver with deep fallback
  const activeMethod = useMemo(() => {
    if (!viewingMethod) return null;
    const res = singleResponse?.data?.item || singleResponse?.data || singleResponse;
    if (res && typeof res === 'object' && res.name) {
      return { ...viewingMethod, ...res };
    }
    return viewingMethod;
  }, [singleResponse, viewingMethod]);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null); // null = Create, object = Edit
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: true,
    icon: '',
  });
  const [iconFile, setIconFile] = useState(null); // File to send directly in 'icon' field
  const [iconPreview, setIconPreview] = useState(''); // Local object URL or remote image URL

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingMethod(null);
    setFormData({
      name: '',
      description: '',
      status: true,
      icon: '',
    });
    setIconFile(null);
    setIconPreview('');
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (method) => {
    setEditingMethod(method);
    setFormData({
      name: method.name || '',
      description: method.description || '',
      status: method.status === true || method.status === 'active',
      icon: method.icon || '',
    });
    setIconFile(null);
    setIconPreview(method.icon || '');
    setIsFormModalOpen(true);
  };

  // Select File Handler (Sends file directly in the 'icon' field of POST/PUT)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    setIconFile(file);
    const localUrl = URL.createObjectURL(file);
    setIconPreview(localUrl);
    setFormData((prev) => ({ ...prev, icon: '' })); // Prioritize file
  };

  // Clear Selected Icon
  const handleClearIcon = () => {
    setIconFile(null);
    setIconPreview('');
    setFormData((prev) => ({ ...prev, icon: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Direct URL Input Handler
  const handleUrlChange = (url) => {
    setIconFile(null);
    setIconPreview(url);
    setFormData((prev) => ({ ...prev, icon: url }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Form Submit: POST or PUT (supports multipart FormData with file in 'icon' key OR JSON)
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showError('Payment method name is required.');
      return;
    }

    try {
      if (iconFile) {
        // Direct file upload in key 'icon' via multipart/form-data
        const formPayload = new FormData();
        formPayload.append('name', formData.name.trim());
        formPayload.append('status', Boolean(formData.status));
        if (formData.description?.trim()) {
          formPayload.append('description', formData.description.trim());
        }
        formPayload.append('icon', iconFile);

        if (editingMethod) {
          await putMethod(formPayload, `/api/payment-methods/${editingMethod._id}`, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          showSuccess(`Payment method "${formData.name.trim()}" updated successfully!`);
        } else {
          await postMethod(formPayload, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          showSuccess(`Payment method "${formData.name.trim()}" created successfully!`);
        }
      } else {
        // JSON payload with icon URL or null
        const jsonPayload = {
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          status: Boolean(formData.status), // strict boolean
          icon: formData.icon?.trim() || null,
        };

        if (editingMethod) {
          await putMethod(jsonPayload, `/api/payment-methods/${editingMethod._id}`);
          showSuccess(`Payment method "${jsonPayload.name}" updated successfully!`);
        } else {
          await postMethod(jsonPayload);
          showSuccess(`Payment method "${jsonPayload.name}" created successfully!`);
        }
      }

      setIsFormModalOpen(false);
      refetchMethods();
    } catch {
      // Backend error toast handled automatically by axios interceptor
    }
  };

  // Toggle Status: PATCH /api/payment-methods/{id}
  const handleToggleStatus = async (method) => {
    const nextStatus = !(method.status === true || method.status === 'active');
    try {
      await patchMethod({ status: nextStatus }, `/api/payment-methods/${method._id}`);
      showSuccess(
        `Payment method "${method.name}" is now ${nextStatus ? 'Active' : 'Inactive'}!`
      );
      refetchMethods();
    } catch {
      // Error handled by interceptor
    }
  };

  // Delete Method: DELETE /api/payment-methods/{id}
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMethod(`/api/payment-methods/${deleteTarget._id}`);
      showSuccess(`Payment method "${deleteTarget.name}" deleted successfully!`);
      setDeleteTarget(null);
      refetchMethods();
    } catch {
      // Error handled by interceptor
    }
  };

  // Count active methods
  const activeCount = useMemo(() => {
    return paymentMethods.filter((m) => m.status === true || m.status === 'active').length;
  }, [paymentMethods]);

  // Table Columns (Strictly NO raw _id displayed)
  const columns = [
    {
      key: 'name',
      header: 'Payment Gateway / Method',
      sortable: true,
      render: (method) => (
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-50 border border-purple-100 overflow-hidden shadow-xs">
            {method.icon ? (
              <img
                src={method.icon}
                alt={method.name}
                className="h-full w-full object-contain p-1.5"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`h-full w-full items-center justify-center text-primary font-bold ${
                method.icon ? 'hidden' : 'flex'
              }`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <div>
            <span className="font-bold text-gray-900 block leading-tight">{method.name}</span>
            <span className="text-xs text-gray-500 font-medium line-clamp-1 max-w-xs mt-0.5">
              {method.description || 'No description provided'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Payment Instructions',
      render: (method) => (
        <span className="text-xs text-gray-600 block max-w-sm">
          {method.description ? (
            <span className="font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100 inline-block text-xs">
              {method.description}
            </span>
          ) : (
            <span className="text-gray-400 italic">None</span>
          )}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (method) => {
        const isActive = method.status === true || method.status === 'active';
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleToggleStatus(method)}
              title={`Click to ${isActive ? 'Deactivate' : 'Activate'}`}
              className="group focus:outline-none"
            >
              <StatusBadge status={isActive ? 'active' : 'inactive'} />
            </button>
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      sortable: true,
      render: (method) => (
        <span className="text-xs text-gray-500">
          {method.createdAt
            ? new Date(method.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (method) => (
        <div className="flex items-center justify-end gap-2">
          {/* View Details */}
          <button
            type="button"
            onClick={() => setViewingMethod(method)}
            title="View Details"
            className="p-1.5 text-gray-500 hover:text-primary hover:bg-purple-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>

          {/* Edit */}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleOpenEdit(method)}
            className="text-xs font-semibold hover:border-primary hover:text-primary"
          >
            Edit
          </Button>

          {/* Delete */}
          <Button
            size="sm"
            variant="danger"
            onClick={() => setDeleteTarget(method)}
            className="text-xs font-semibold"
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-primary via-purple-700 to-indigo-800 p-6 sm:p-8 text-white shadow-xl shadow-primary/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur">
                Financial Gateways
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                ● {activeCount} Active / {paymentMethods.length} Methods
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Payment Methods Directory
            </h2>
            <p className="mt-1 text-purple-100 text-sm max-w-xl leading-relaxed">
              Manage bank transfers, mobile wallets (Vodafone Cash, InstaPay), credit card gateways, and offline cash channels.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => refetchMethods()}
              disabled={isLoading}
              className="bg-white/10 text-white hover:bg-white/20 border border-white/20"
            >
              {isLoading ? 'Refreshing...' : '↻ Refresh'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleOpenCreate}
              className="bg-white text-primary hover:bg-purple-50 font-bold shadow-md"
            >
              + Add Payment Method
            </Button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <section className="space-y-4">
        <GenericTable
          title="Configured Payment Methods"
          columns={columns}
          data={paymentMethods}
          loading={isLoading}
          keyField="_id"
          emptyMessage="No payment methods found. Add your first payment gateway or wallet channel!"
          pageSize={10}
          actions={
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 py-1.5 px-3 text-xs text-gray-700 font-medium focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          }
        />
      </section>

      {/* Create / Edit Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-primary to-purple-800 text-white">
              <div>
                <h3 className="text-lg font-bold">
                  {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
                </h3>
                <p className="text-xs text-purple-200">
                  Configure gateway details, wallet numbers, and brand icon
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="text-white/80 hover:text-white text-2xl font-semibold leading-none p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Method Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Method Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Vodafone Cash, InstaPay, Credit Card"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              {/* Description / Instructions */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Payment Instructions / Wallet Number
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Send wallet transfer to 01012345678, or Bank account IBAN: EG..."
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  value={formData.status ? 'active' : 'inactive'}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value === 'active' })
                  }
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="active">Active (Available for club checkout)</option>
                  <option value="inactive">Inactive (Temporarily disabled)</option>
                </select>
              </div>

              {/* Icon / Logo Section (File sent directly in 'icon' key) */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Gateway Icon / Logo
                    </label>
                    <p className="text-xs text-gray-500">
                      Upload an image file directly (in `icon` field) or paste an image URL.
                    </p>
                  </div>

                  {(iconPreview || formData.icon) && (
                    <button
                      type="button"
                      onClick={handleClearIcon}
                      className="text-xs text-red-600 hover:text-red-700 font-bold hover:underline"
                    >
                      Clear Icon
                    </button>
                  )}
                </div>

                {/* Preview Thumbnail */}
                {(iconPreview || formData.icon) && (
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <img
                      src={iconPreview || formData.icon}
                      alt="Icon Preview"
                      className="h-12 w-12 object-contain rounded-md border border-gray-100 p-1 bg-white"
                      onError={(e) => {
                        e.target.src = 'https://placehold.co/100x100?text=Icon';
                      }}
                    />
                    <div className="text-xs text-gray-600 truncate max-w-xs">
                      <span className="font-bold text-gray-800 block">
                        {iconFile ? `Selected File: ${iconFile.name}` : 'Icon Source:'}
                      </span>
                      <span className="text-[11px] text-gray-500 font-mono truncate block">
                        {iconFile
                          ? `${(iconFile.size / 1024).toFixed(1)} KB (will upload in key 'icon')`
                          : formData.icon || 'Preview loaded'}
                      </span>
                    </div>
                  </div>
                )}

                {/* File Upload Trigger */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-primary border-primary/30 hover:bg-purple-50"
                  >
                    📁 Choose Icon File
                  </Button>
                  <span className="text-xs text-gray-400">PNG, JPG, SVG, WebP</span>
                </div>

                {/* Or Direct URL Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Or Enter Image URL directly:
                  </label>
                  <input
                    type="url"
                    value={formData.icon}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://sportego.org/uploads/vodafone.png"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-white focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsFormModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isPosting || isPutting}
                >
                  {isPosting || isPutting ? (
                    <span className="flex items-center gap-2">
                      <Loader size="sm" />
                      Saving...
                    </span>
                  ) : editingMethod ? (
                    'Save Changes'
                  ) : (
                    'Create Method'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Method Details Modal (GET /api/payment-methods/{id}) */}
      {viewingMethod && activeMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-primary to-purple-800 text-white">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">{activeMethod.name}</h3>
                  {isSingleLoading && (
                    <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded text-white flex items-center gap-1">
                      <Loader size="sm" /> Syncing...
                    </span>
                  )}
                </div>
                <p className="text-xs text-purple-200">Payment Gateway Details</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingMethod(null)}
                className="text-white/80 hover:text-white text-2xl font-semibold leading-none p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Icon & Name */}
              <div className="flex items-center gap-4 p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white border border-purple-100 shadow-xs overflow-hidden">
                  {activeMethod.icon ? (
                    <img
                      src={activeMethod.icon}
                      alt={activeMethod.name}
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-base text-gray-900">{activeMethod.name}</h4>
                  <div className="mt-1">
                    <StatusBadge
                      status={
                        activeMethod.status === true || activeMethod.status === 'active'
                          ? 'active'
                          : 'inactive'
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1">
                  Payment Instructions
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-800 leading-relaxed font-mono">
                  {activeMethod.description || 'No special instructions recorded.'}
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-3 text-xs border-t border-gray-100 pt-3 text-gray-500">
                <div>
                  <span className="font-semibold block text-gray-400">Created:</span>
                  <span>
                    {activeMethod.createdAt
                      ? new Date(activeMethod.createdAt).toLocaleString()
                      : '—'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold block text-gray-400">Updated:</span>
                  <span>
                    {activeMethod.updatedAt
                      ? new Date(activeMethod.updatedAt).toLocaleString()
                      : '—'}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const toEdit = activeMethod;
                    setViewingMethod(null);
                    handleOpenEdit(toEdit);
                  }}
                  className="text-xs font-semibold"
                >
                  Edit This Method
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setViewingMethod(null)}
                  className="text-xs font-semibold"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Payment Method?</h3>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              Are you sure you want to delete payment method{' '}
              <strong className="text-gray-900 font-bold">"{deleteTarget.name}"</strong>? Clubs
              will no longer be able to select this payment option.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <Loader size="sm" />
                    Deleting...
                  </span>
                ) : (
                  'Yes, Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethods;

