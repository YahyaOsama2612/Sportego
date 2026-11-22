import React, { useState, useMemo } from 'react';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import GenericTable from '../components/shared/GenericTable';
import StatusBadge from '../components/others/StatusBadge';
import Loader from '../components/shared/Loader';
import useGet from '../hooks/useGet';
import usePost from '../hooks/usePost';
import usePut from '../hooks/usePut';
import useDelete from '../hooks/useDelete';
import { useToast } from '../context/ToastContext';

// Safe currency formatter
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

// Calculate effective price after discount
const calculateEffectivePrice = (price, discount = 0, discountType = 'percentage') => {
  const p = Number(price) || 0;
  const d = Number(discount) || 0;
  if (discountType === 'percentage') {
    return Math.max(0, p - (p * d) / 100);
  }
  return Math.max(0, p - d);
};

const defaultCycleTemplate = {
  name: 'Monthly',
  months: 1,
  price: 1000,
  discount: 0,
  discount_type: 'percentage',
};

const Packages = () => {
  const { showSuccess, showError } = useToast();

  // 1. Hook for GET /api/packages
  const {
    data: packagesData,
    loading: packagesLoading,
    refetch: refetchPackages,
  } = useGet('/api/packages', {
    params: { page: 1, limit: 20 },
    immediate: true,
  });

  // 2. Hooks for Sports / Games (Fetch from both /api/games and /api/games/select for total resilience)
  const { data: gamesSelectData, loading: isGamesSelectLoading } = useGet('/api/games/select', {
    immediate: true,
  });
  const { data: gamesListData, loading: isGamesListLoading } = useGet('/api/games', {
    params: { page: 1, limit: 100 },
    immediate: true,
  });

  // 3. Hook for POST /api/packages
  const { execute: postPackage, loading: isPosting } = usePost('/api/packages');

  // 4. Hook for PUT /api/packages/{id}
  const { execute: putPackage, loading: isPutting } = usePut();

  // 5. Hook for DELETE /api/packages/{id}
  const { execute: deletePackage, loading: isDeleting } = useDelete();

  // 6. Hook for GET /api/packages/{id} (Single item inspection)
  const [viewingPackage, setViewingPackage] = useState(null);
  const viewingPackageId = viewingPackage?._id || null;
  const {
    data: singlePackageResponse,
    loading: isSingleLoading,
  } = useGet(viewingPackageId ? `/api/packages/${viewingPackageId}` : '', {
    immediate: Boolean(viewingPackageId),
  });

  // Extract package items from backend response
  const packages = useMemo(() => {
    return packagesData?.data?.items || packagesData?.items || [];
  }, [packagesData]);

  // Aggregate ALL sports from /api/games/select + /api/games + loaded packages
  const gameOptions = useMemo(() => {
    const map = new Map();

    // 1. From /api/games/select
    const itemsFromSelect =
      gamesSelectData?.data?.items ||
      (Array.isArray(gamesSelectData?.data) ? gamesSelectData.data : []) ||
      gamesSelectData?.items ||
      [];
    itemsFromSelect.forEach((g) => {
      if (g && (g._id || g.id) && g.name) {
        map.set(g._id || g.id, { _id: g._id || g.id, name: g.name });
      }
    });

    // 2. From /api/games full list
    const itemsFromList =
      gamesListData?.data?.items ||
      (Array.isArray(gamesListData?.data) ? gamesListData.data : []) ||
      gamesListData?.items ||
      [];
    itemsFromList.forEach((g) => {
      if (g && (g._id || g.id) && g.name) {
        map.set(g._id || g.id, { _id: g._id || g.id, name: g.name });
      }
    });

    // 3. From loaded packages themselves (guarantees package's current sport is always present)
    packages.forEach((pkg) => {
      if (pkg?.game_id && typeof pkg.game_id === 'object' && (pkg.game_id._id || pkg.game_id.id)) {
        const id = pkg.game_id._id || pkg.game_id.id;
        if (!map.has(id)) {
          map.set(id, { _id: id, name: pkg.game_id.name || 'Sport' });
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [gamesSelectData, gamesListData, packages]);

  // Active package details resolver with deep fallback to table data
  const activePackage = useMemo(() => {
    if (!viewingPackage) return null;

    // Helper to extract package details from any backend response wrapper
    const extractPackage = (res) => {
      if (!res || typeof res !== 'object') return null;
      if (res.name && (res.teams !== undefined || res.cycles !== undefined || res.players !== undefined)) {
        return res;
      }
      if (res.data && typeof res.data === 'object') {
        const nested = extractPackage(res.data);
        if (nested) return nested;
      }
      if (res.package && typeof res.package === 'object') {
        const nested = extractPackage(res.package);
        if (nested) return nested;
      }
      if (res.item && typeof res.item === 'object') {
        const nested = extractPackage(res.item);
        if (nested) return nested;
      }
      return null;
    };

    const resolved = extractPackage(singlePackageResponse);

    // Merge: viewingPackage from table row guarantees full data is displayed immediately,
    // while resolved updates with any additional details from GET /api/packages/{id}
    return {
      ...viewingPackage,
      ...(resolved || {}),
      game_id:
        (resolved?.game_id && typeof resolved.game_id === 'object'
          ? resolved.game_id
          : viewingPackage.game_id) || null,
      cycles:
        Array.isArray(resolved?.cycles) && resolved.cycles.length > 0
          ? resolved.cycles
          : Array.isArray(viewingPackage.cycles)
          ? viewingPackage.cycles
          : [],
    };
  }, [singlePackageResponse, viewingPackage]);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null); // null = Create, object = Edit
  const [deleteTarget, setDeleteTarget] = useState(null); // null = closed, object = deleting

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    game_id: '',
    teams: 10,
    players: 40,
    status: true,
    cycles: [{ ...defaultCycleTemplate }],
  });

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingPackage(null);
    setFormData({
      name: '',
      game_id: gameOptions[0]?._id || '',
      teams: 10,
      players: 40,
      status: true,
      cycles: [{ ...defaultCycleTemplate }],
    });
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (pkg) => {
    setEditingPackage(pkg);
    const existingGameId =
      typeof pkg.game_id === 'object' && pkg.game_id?._id
        ? pkg.game_id._id
        : pkg.game_id || '';

    setFormData({
      name: pkg.name || '',
      game_id: existingGameId,
      teams: pkg.teams ?? 10,
      players: pkg.players ?? 40,
      status: pkg.status === true || pkg.status === 'active',
      cycles:
        Array.isArray(pkg.cycles) && pkg.cycles.length > 0
          ? pkg.cycles.map((c) => ({
              name: c.name || 'Cycle',
              months: c.months ?? 1,
              price: c.price ?? 0,
              discount: c.discount ?? 0,
              discount_type: c.discount_type || 'percentage',
            }))
          : [{ ...defaultCycleTemplate }],
    });
    setIsFormModalOpen(true);
  };

  // Add Cycle Row
  const handleAddCycle = () => {
    setFormData((prev) => ({
      ...prev,
      cycles: [
        ...prev.cycles,
        {
          name: 'Annual',
          months: 12,
          price: 10000,
          discount: 10,
          discount_type: 'percentage',
        },
      ],
    }));
  };

  // Remove Cycle Row
  const handleRemoveCycle = (index) => {
    if (formData.cycles.length <= 1) {
      showError('A package must have at least one billing cycle.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      cycles: prev.cycles.filter((_, i) => i !== index),
    }));
  };

  // Change Cycle Field
  const handleCycleChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.cycles];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, cycles: updated };
    });
  };

  // Form Submit: POST /api/packages or PUT /api/packages/{id}
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showError('Package name is required.');
      return;
    }

    if (!formData.game_id) {
      showError('Please select a sport/game for this package.');
      return;
    }

    if (formData.cycles.length === 0) {
      showError('At least one billing cycle is required.');
      return;
    }

    // Prepare strictly typed payload
    const payload = {
      name: formData.name.trim(),
      game_id: formData.game_id,
      teams: Math.max(1, parseInt(formData.teams, 10) || 1),
      players: Math.max(1, parseInt(formData.players, 10) || 1),
      status: Boolean(formData.status), // strict boolean
      cycles: formData.cycles.map((c) => ({
        name: c.name.trim() || 'Billing Cycle',
        months: Math.max(1, parseInt(c.months, 10) || 1),
        price: Math.max(0, parseFloat(c.price) || 0),
        discount: Math.max(0, parseFloat(c.discount) || 0),
        discount_type: c.discount_type || 'percentage',
      })),
    };

    try {
      if (editingPackage) {
        // PUT /api/packages/{id}
        await putPackage(payload, `/api/packages/${editingPackage._id}`);
        showSuccess(`Package "${payload.name}" updated successfully!`);
      } else {
        // POST /api/packages
        await postPackage(payload);
        showSuccess(`Package "${payload.name}" created successfully!`);
      }

      setIsFormModalOpen(false);
      refetchPackages();
    } catch {
      // Backend error toast handled automatically by axios interceptor
    }
  };

  // Delete Package: DELETE /api/packages/{id}
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const packageId = deleteTarget._id || deleteTarget.id;
    if (!packageId) {
      showError('This package does not have an ID and cannot be deleted.');
      return;
    }

    try {
      await deletePackage(`/api/packages/${packageId}`);
      showSuccess(`Package "${deleteTarget.name}" deleted successfully!`);
      setDeleteTarget(null);
      refetchPackages();
    } catch {
      // Error handled by interceptor
    }
  };

  // Table Columns (Strictly NO internal MongoDB IDs displayed)
  const columns = [
    {
      key: 'name',
      header: 'Package Plan',
      sortable: true,
      render: (pkg) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-primary font-bold shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-gray-900 block leading-tight">{pkg.name}</span>
            <span className="text-xs text-gray-500 font-medium">
              {pkg.game_id?.name || 'Multi-sport'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'limits',
      header: 'Club Limits',
      render: (pkg) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              👥 {pkg.teams ?? 0} Teams
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              🏃 {pkg.players ?? 0} Players
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'cycles',
      header: 'Billing Cycles',
      render: (pkg) => {
        const cycles = Array.isArray(pkg.cycles) ? pkg.cycles : [];
        if (cycles.length === 0) {
          return <span className="text-xs text-gray-400">No cycles set</span>;
        }

        const prices = cycles.map((c) => calculateEffectivePrice(c.price, c.discount, c.discount_type));
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        return (
          <div>
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              {cycles.slice(0, 3).map((c, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200"
                >
                  {c.name}: {formatCurrency(c.price)}
                </span>
              ))}
              {cycles.length > 3 && (
                <span className="text-[11px] text-gray-400 font-medium">
                  +{cycles.length - 3} more
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 font-semibold">
              Range: {formatCurrency(minPrice)} - {formatCurrency(maxPrice)}
            </p>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (pkg) => {
        const isActive = pkg.status === true || pkg.status === 'active';
        return <StatusBadge status={isActive ? 'active' : 'inactive'} />;
      },
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      sortable: true,
      render: (pkg) => (
        <span className="text-xs text-gray-500">
          {pkg.createdAt
            ? new Date(pkg.createdAt).toLocaleDateString(undefined, {
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
      render: (pkg) => (
        <div className="flex items-center justify-end gap-2">
          {/* View Details */}
          <button
            type="button"
            onClick={() => setViewingPackage(pkg)}
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
            onClick={() => handleOpenEdit(pkg)}
            className="text-xs font-semibold hover:border-primary hover:text-primary"
          >
            Edit
          </Button>

          {/* Delete */}
          <Button
            size="sm"
            variant="danger"
            onClick={() => setDeleteTarget(pkg)}
            loading={deleteTarget === pkg && isDeleting}
            disabled={deleteTarget === pkg && isDeleting}
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
                Subscription & Pricing Plans
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                ● {packages.length} Packages Configured
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Subscription Packages
            </h2>
            <p className="mt-1 text-purple-100 text-sm max-w-xl leading-relaxed">
              Manage club subscription tiers, team/player limits, and recurring billing cycles.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => refetchPackages()}
              disabled={packagesLoading}
              className="bg-white/10 text-white hover:bg-white/20 border border-white/20"
            >
              {packagesLoading ? 'Refreshing...' : '↻ Refresh'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleOpenCreate}
              className="bg-white text-primary hover:bg-purple-50 font-bold shadow-md"
            >
              + Create Package
            </Button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <section className="space-y-4">
        <GenericTable
          title="All Packages & Plans"
          columns={columns}
          data={packages}
          loading={packagesLoading}
          keyField="_id"
          emptyMessage="No packages found. Create your first subscription plan!"
          pageSize={10}
        />
      </section>

      {/* Create / Edit Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-primary to-purple-800 text-white">
              <div>
                <h3 className="text-lg font-bold">
                  {editingPackage ? 'Edit Package Plan' : 'Create New Package'}
                </h3>
                <p className="text-xs text-purple-200">
                  Configure limits, sport association, and flexible billing cycles
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
            <form onSubmit={handleFormSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Package Name & Sport */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Package Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Football Pro"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Sport / Game *
                  </label>
                  <select
                    required
                    value={formData.game_id}
                    onChange={(e) => setFormData({ ...formData, game_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="">
                      {gameOptions.length === 0
                        ? isGamesSelectLoading || isGamesListLoading
                          ? 'Loading sports catalog...'
                          : 'No sports found'
                        : `Select a sport (${gameOptions.length} available)...`}
                    </option>
                    {gameOptions.map((game) => (
                      <option key={game._id} value={game._id}>
                        {game.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Limits: Teams & Players */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Max Teams Limit *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.teams}
                    onChange={(e) => setFormData({ ...formData, teams: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Max Players Limit *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.players}
                    onChange={(e) => setFormData({ ...formData, players: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status ? 'active' : 'inactive'}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value === 'active' })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="active">Active (Available)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Billing Cycles Section */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Billing Cycles & Pricing</h4>
                    <p className="text-xs text-gray-500">
                      Add subscription durations, pricing, and discount incentives.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={handleAddCycle}
                    className="text-xs font-semibold text-primary border-primary/30 hover:bg-purple-50"
                  >
                    + Add Cycle
                  </Button>
                </div>

                <div className="space-y-3 pt-2">
                  {formData.cycles.map((cycle, index) => {
                    const finalPrice = calculateEffectivePrice(
                      cycle.price,
                      cycle.discount,
                      cycle.discount_type
                    );

                    return (
                      <div
                        key={index}
                        className="p-3.5 bg-white border border-gray-200 rounded-lg shadow-sm space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                          <span className="text-xs font-bold text-primary uppercase tracking-wider">
                            Cycle #{index + 1}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Final: {formatCurrency(finalPrice)}
                            </span>
                            {formData.cycles.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveCycle(index)}
                                className="text-xs text-red-600 hover:text-red-800 font-bold hover:underline"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                          {/* Cycle Name */}
                          <div className="col-span-2 sm:col-span-1">
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                              Name
                            </label>
                            <input
                              type="text"
                              required
                              value={cycle.name}
                              onChange={(e) => handleCycleChange(index, 'name', e.target.value)}
                              placeholder="Monthly / Annual"
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>

                          {/* Months */}
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                              Months
                            </label>
                            <input
                              type="number"
                              min="1"
                              required
                              value={cycle.months}
                              onChange={(e) =>
                                handleCycleChange(index, 'months', parseInt(e.target.value, 10) || 1)
                              }
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>

                          {/* Price */}
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                              Price (EGP)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              required
                              value={cycle.price}
                              onChange={(e) =>
                                handleCycleChange(index, 'price', parseFloat(e.target.value) || 0)
                              }
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>

                          {/* Discount */}
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                              Discount
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={cycle.discount}
                              onChange={(e) =>
                                handleCycleChange(
                                  index,
                                  'discount',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                            />
                          </div>

                          {/* Discount Type */}
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                              Type
                            </label>
                            <select
                              value={cycle.discount_type || 'percentage'}
                              onChange={(e) =>
                                handleCycleChange(index, 'discount_type', e.target.value)
                              }
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white focus:ring-1 focus:ring-primary focus:outline-none"
                            >
                              <option value="percentage">% Percent</option>
                              <option value="amount">Fixed Amt</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Actions */}
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
                  ) : editingPackage ? (
                    'Save Changes'
                  ) : (
                    'Create Package'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Package Details Modal (Powered by GET /api/packages/{id}) */}
      {viewingPackage && activePackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-primary to-purple-800 text-white">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">{activePackage.name}</h3>
                  {isSingleLoading && (
                    <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded text-white flex items-center gap-1">
                      <Loader size="sm" /> Syncing...
                    </span>
                  )}
                </div>
                <p className="text-xs text-purple-200">
                  {activePackage.game_id?.name || 'General Sport'} • Package Details
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingPackage(null)}
                className="text-white/80 hover:text-white text-2xl font-semibold leading-none p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Key Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <span className="text-[11px] font-semibold text-primary uppercase">Status</span>
                  <div className="mt-1">
                    <StatusBadge
                      status={
                        activePackage.status === true || activePackage.status === 'active'
                          ? 'active'
                          : 'inactive'
                      }
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <span className="text-[11px] font-semibold text-blue-700 uppercase">Teams</span>
                  <p className="text-lg font-black text-blue-900 mt-1">{activePackage.teams ?? 0}</p>
                </div>

                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                  <span className="text-[11px] font-semibold text-indigo-700 uppercase">Players</span>
                  <p className="text-lg font-black text-indigo-900 mt-1">{activePackage.players ?? 0}</p>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-[11px] font-semibold text-emerald-700 uppercase">Cycles</span>
                  <p className="text-lg font-black text-emerald-900 mt-1">
                    {Array.isArray(activePackage.cycles) ? activePackage.cycles.length : 0}
                  </p>
                </div>
              </div>

              {/* Billing Cycles Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Configured Billing Cycles
                </h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {Array.isArray(activePackage.cycles) && activePackage.cycles.length > 0 ? (
                    activePackage.cycles.map((c, i) => {
                      const finalPrice = calculateEffectivePrice(
                        c.price,
                        c.discount,
                        c.discount_type
                      );
                      const monthlyEquivalent = c.months > 0 ? finalPrice / c.months : finalPrice;

                      return (
                        <div key={i} className="p-3.5 flex items-center justify-between hover:bg-gray-50">
                          <div>
                            <span className="font-bold text-sm text-gray-900">{c.name}</span>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Duration: <span className="font-semibold">{c.months} month(s)</span>
                              {c.discount > 0 && (
                                <span className="ml-2 text-emerald-600 font-semibold">
                                  ({c.discount}
                                  {c.discount_type === 'percentage' ? '%' : ' EGP'} discount)
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-sm text-primary block">
                              {formatCurrency(finalPrice)}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              ~{formatCurrency(monthlyEquivalent)}/mo
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-gray-500">No cycles set</div>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
                <span>
                  Created:{' '}
                  {activePackage.createdAt
                    ? new Date(activePackage.createdAt).toLocaleString()
                    : '—'}
                </span>
                <span>
                  Updated:{' '}
                  {activePackage.updatedAt
                    ? new Date(activePackage.updatedAt).toLocaleString()
                    : '—'}
                </span>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const toEdit = activePackage;
                    setViewingPackage(null);
                    handleOpenEdit(toEdit);
                  }}
                  className="text-xs font-semibold"
                >
                  Edit This Package
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setViewingPackage(null)}
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
              <h3 className="text-lg font-bold text-gray-900">Delete Package Plan?</h3>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              Are you sure you want to delete{' '}
              <strong className="text-gray-900 font-bold">"{deleteTarget.name}"</strong>? This will
              remove this pricing package from future club subscriptions.
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

export default Packages;
