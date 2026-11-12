import { useMemo, useState } from 'react';
import GenericTable from '../components/shared/GenericTable';
import Button from '../components/shared/Button';
import StatusBadge from '../components/others/StatusBadge';
import useGet from '../hooks/useGet';

const pageSize = 10;

const extractItems = (response) => {
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.items)) return response.items;
  return [];
};

const getErrorMessage = (error) =>
  (typeof error === 'string' ? error : '') ||
  error?.response?.data?.message ||
  error?.response?.data?.error?.message ||
  (typeof error?.response?.data?.error === 'string' ? error.response.data.error : '') ||
  error?.message ||
  'The request could not be completed.';

const Actions = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [gameId, setGameId] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  const params = useMemo(
    () => ({
      page,
      limit: pageSize,
      sort_by: sortBy,
      order,
      ...(status !== 'all' ? { status: status === 'true' } : {}),
      ...(gameId !== 'all' ? { game_id: gameId } : {}),
    }),
    [page, status, gameId, sortBy, order]
  );

  const {
    data: actionsResponse,
    loading,
    error,
  } = useGet('/api/actions', { params, immediate: true });
  const { data: gamesResponse, loading: gamesLoading, error: gamesError } = useGet(
    '/api/games',
    { params: { page: 1, limit: 100 }, immediate: true }
  );

  const actions = useMemo(() => extractItems(actionsResponse), [actionsResponse]);
  const games = useMemo(() => extractItems(gamesResponse), [gamesResponse]);
  const pagination = actionsResponse?.data?.pagination || actionsResponse?.pagination || {};
  const totalPages =
    Number(pagination.totalPages) ||
    (pagination.total != null ? Math.ceil(Number(pagination.total) / pageSize) : 1);
  const pageCount = Math.max(totalPages, 1);

  const columns = [
    {
      key: 'name',
      header: 'Action',
      render: (action) => (
        <span className="font-semibold text-gray-900">{action.name || '-'}</span>
      ),
    },
    {
      key: 'game_id',
      header: 'Game',
      render: (action) => action.game_id?.name || '-',
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      render: (action) => {
        if (!action.createdAt) return '-';
        const date = new Date(action.createdAt);
        return Number.isNaN(date.getTime()) ? action.createdAt : date.toLocaleDateString();
      },
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (action) => (
        <StatusBadge
          status={action.status ? 'active' : 'inactive'}
          label={action.status ? 'Active' : 'Inactive'}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-8">
      <section className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Actions</h2>
          <p className="mt-1 text-sm text-gray-500">
            Browse and filter actions by game and status.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            Status
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            Game
            <select
              value={gameId}
              onChange={(event) => {
                setGameId(event.target.value);
                setPage(1);
              }}
              disabled={gamesLoading}
              className="min-w-40 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
            >
              <option value="all">All games</option>
              {games.map((game) => (
                <option key={game._id || game.id} value={game._id || game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            Sort by
            <select
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="createdAt">Created date</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
            Order
            <select
              value={order}
              onChange={(event) => {
                setOrder(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </label>
        </div>
      </section>

      {(error || gamesError) && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ? `Unable to load actions: ${getErrorMessage(error)}` : `Unable to load games: ${getErrorMessage(gamesError)}`}
        </div>
      )}

      <GenericTable
        title="Action Directory"
        columns={columns}
        data={actions}
        loading={loading}
        pagination={false}
        searchable={false}
        keyField="_id"
        emptyMessage={error ? 'Actions could not be loaded.' : 'No actions found.'}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-gray-500">
          {pagination.total != null ? `${pagination.total} actions` : `${actions.length} actions`}
          {' · '}Page {page} of {pageCount}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={loading || page <= 1}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={loading || page >= pageCount}
            onClick={() => setPage((current) => Math.min(current + 1, pageCount))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Actions;
