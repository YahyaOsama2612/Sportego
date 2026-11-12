import React, { useState, useMemo } from 'react';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import GenericTable from '../components/shared/GenericTable';
import StatusBadge from '../components/others/StatusBadge';
import useGet from '../hooks/useGet';
import usePost from '../hooks/usePost';
import usePut from '../hooks/usePut';
import usePatch from '../hooks/usePatch';
import useDelete from '../hooks/useDelete';
import { useToast } from '../context/ToastContext';

const Games = () => {
  const { showSuccess } = useToast();

  // Filter & Query Parameters State (matches payment methods API params)
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'true' | 'false'
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Query Params for GET /api/games (page, limit, sort_by, order, status)
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

  // 1. Hook for GET /api/games
  const {
    data: gamesData,
    loading: gamesLoading,
    refetch: refetchGames,
  } = useGet('/api/games', {
    params: queryParams,
    immediate: true,
  });

  // 2. Hook for POST /api/games
  const { execute: postGame, loading: isPosting } = usePost('/api/games');

  // 3. Hook for PUT /api/games/{id}
  const { execute: putGame, loading: isPutting } = usePut();

  // 4. Hook for PATCH /api/games/{id}
  const { execute: patchGame } = usePatch();


  // 5. Hook for DELETE /api/games/{id}
  const { execute: deleteGame, loading: isDeleting } = useDelete();

  // Extract items from real backend GET response
  const games = useMemo(() => {
    return gamesData?.data?.items || gamesData?.items || [];
  }, [gamesData]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState(null); // null = Create, object = Edit
  const [formData, setFormData] = useState({ name: '', status: true });

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingGame(null);
    setFormData({ name: '', status: true });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (game) => {
    setEditingGame(game);
    setFormData({
      name: game.name || '',
      status: game.status === true || game.status === 'active',
    });
    setIsModalOpen(true);
  };

  // Form Submit: POST /api/games or PUT /api/games/{id}
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      name: formData.name.trim(),
      status: Boolean(formData.status), // strict boolean for backend validator
    };

    try {
      if (editingGame) {
        // PUT /api/games/{id} using usePut hook
        await putGame(payload, `/api/games/${editingGame._id}`);
        showSuccess(`Game "${payload.name}" updated successfully!`);
      } else {
        // POST /api/games using usePost hook
        await postGame(payload);
        showSuccess(`Game "${payload.name}" created successfully!`);
      }

      setIsModalOpen(false);
      refetchGames();
    } catch {
      // Backend error toast is handled globally by axios interceptor
    }
  };

  // Toggle Status: PATCH /api/games/{id}
  const handleToggleStatus = async (game) => {
    const isCurrentlyActive = game.status === true || game.status === 'active';
    const nextStatus = !isCurrentlyActive; // strict boolean

    try {
      // PATCH /api/games/{id} using usePatch hook
      await patchGame({ status: nextStatus }, `/api/games/${game._id}`);
      showSuccess(`Status changed to ${nextStatus ? 'ACTIVE' : 'INACTIVE'}`);
      refetchGames();
    } catch {
      // Handled by axios toast
    }
  };

  // Delete Game: DELETE /api/games/{id}
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      // DELETE /api/games/{id} using useDelete hook
      await deleteGame(`/api/games/${deleteTarget._id}`);
      showSuccess(`Game "${deleteTarget.name}" deleted successfully!`);
      setDeleteTarget(null);
      refetchGames();
    } catch {
      // Handled by axios toast
    }
  };

  // Table Columns Definition (strictly NO internal ID displayed)
  const columns = [
    {
      key: 'name',
      header: 'Sport / Game Name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
            {row.name ? row.name.substring(0, 2).toUpperCase() : 'GM'}
          </div>
          <div>
            <span className="font-bold text-gray-900 block text-sm">{row.name}</span>
            <span className="text-xs text-gray-400">Sportego Category</span>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      align: 'center',
      render: (row) => {
        const isActive = row.status === true || row.status === 'active';
        return (
          <button
            type="button"
            onClick={() => handleToggleStatus(row)}
            title="Click to toggle status (PATCH)"
            className="cursor-pointer group"
          >
            <StatusBadge
              status={isActive ? 'active' : 'inactive'}
              label={isActive ? 'Active' : 'Inactive'}
            />
          </button>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-gray-500 font-medium">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenEdit(row)}
            className="text-xs"
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setDeleteTarget(row)}
            className="text-xs"
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
                Catalog Management
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                ● {games.length} Sports Loaded
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Games & Sports Directory
            </h2>
           
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => refetchGames()}
              disabled={gamesLoading}
              className="bg-white/10 text-white hover:bg-white/20 border border-white/20"
            >
              {gamesLoading ? 'Refreshing...' : '↻ Refresh'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleOpenCreate}
              className="bg-white text-primary hover:bg-purple-50 font-bold shadow-md"
            >
              + Add New Game
            </Button>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <section className="space-y-4">
        <GenericTable
          title="All Sports Games"
          columns={columns}
          data={games}
          loading={gamesLoading}
          pageSize={10}
          searchable={true}
          pagination={true}
          emptyMessage="No games registered yet. Click '+ Add New Game' to create one."
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

      {/* Create / Edit Modal (usePost / usePut) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editingGame ? 'Edit Sport Game' : 'Add New Sport Game'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  Game / Sport Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Football, Basketball, Padel"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 px-3.5 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  Initial Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: true })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${formData.status === true
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    ● Active
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: false })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${formData.status === false
                        ? 'border-gray-500 bg-gray-100 text-gray-800 ring-2 ring-gray-500/20'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    ○ Inactive
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isPosting || isPutting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isPosting || isPutting || !formData.name.trim()}
                >
                  {isPosting || isPutting
                    ? 'Saving...'
                    : editingGame
                      ? 'Update Game'
                      : 'Create Game'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (useDelete) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-4 ring-8 ring-red-50/50">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-gray-900">Delete Sport Game?</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Are you sure you want to delete <strong className="text-gray-800 font-semibold">{deleteTarget.name}</strong>? This action cannot be undone.
            </p>

            <div className="flex items-center justify-center gap-3 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Games;
