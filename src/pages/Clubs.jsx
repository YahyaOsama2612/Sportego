import { useMemo, useState } from 'react';
import StatusBadge from '../components/others/StatusBadge';
import Button from '../components/shared/Button';
import Loader from '../components/shared/Loader';
import useDelete from '../hooks/useDelete';
import useGet from '../hooks/useGet';
import usePost from '../hooks/usePost';
import usePut from '../hooks/usePut';
import { useToast } from '../context/ToastContext';

const pageSize = 20;

const localDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addMonths = (dateString, months) => {
  if (!dateString) return '';
  const date = new Date(`${dateString}T12:00:00`);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + (Number(months) || 0));
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return localDate(date);
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
};

const requestError = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error?.message ||
  error?.message ||
  'The request could not be completed.';

const extractItems = (response) => {
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const initialForm = () => {
  const startDate = localDate(new Date());
  return {
    name: '',
    subdomain: '',
    package_id: '',
    cycle_id: '',
    start_date: startDate,
    end_date: addMonths(startDate, 12),
    status: true,
    admin_name: '',
    admin_email: '',
    admin_password: '',
  };
};

const Clubs = () => {
  const { showError, showSuccess } = useToast();
  const [search, setSearch] = useState('');
  const [pageState, setPageState] = useState({ page: 1, search: '' });
  const page = pageState.search === search ? pageState.page : 1;
  const setPage = (nextPage) => {
    setPageState({
      page: typeof nextPage === 'function' ? nextPage(page) : nextPage,
      search,
    });
  };
  const [statusFilter, setStatusFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [actionError, setActionError] = useState('');

  const params = useMemo(() => ({
    page,
    limit: pageSize,
    ...(search.trim() ? { search: search.trim() } : {}),
    ...(statusFilter !== 'all' ? { status: statusFilter === 'active' } : {}),
    ...(subscriptionFilter !== 'all' ? { subscription_status: subscriptionFilter } : {}),
  }), [page, search, statusFilter, subscriptionFilter]);

  const {
    data: clubsResponse,
    loading,
    error,
    refetch,
  } = useGet('/api/clubs', { params, immediate: true });
  const {
    data: packagesResponse,
    loading: packagesLoading,
    error: packagesError,
  } = useGet('/api/packages', { params: { page: 1, limit: 100 }, immediate: true });
  const { execute: createClub, loading: creating } = usePost('/api/clubs');
  const { execute: updateClub, loading: updating } = usePut();
  const { execute: deleteClub, loading: deleting } = useDelete();

  const clubs = useMemo(() => extractItems(clubsResponse), [clubsResponse]);
  const packages = useMemo(() => extractItems(packagesResponse), [packagesResponse]);
  const packagesWithCycles = packages.filter(
    (pkg) => Array.isArray(pkg.cycles) && pkg.cycles.length > 0
  );
  const selectedPackage = packages.find(
    (pkg) => (pkg._id || pkg.id) === formData.package_id
  );
  const cycles = Array.isArray(selectedPackage?.cycles) ? selectedPackage.cycles : [];
  const pagination = clubsResponse?.data?.pagination || clubsResponse?.pagination || {};
  const totalPages =
    Number(pagination.totalPages || pagination.pages) ||
    (pagination.total ? Math.ceil(Number(pagination.total) / pageSize) : 0);
  const canGoNext = totalPages ? page < totalPages : clubs.length === pageSize;
  const isSaving = creating || updating;

  const openCreate = () => {
    const firstPackage = packagesWithCycles[0];
    const firstCycle = firstPackage?.cycles?.[0];
    const form = initialForm();
    form.package_id = firstPackage?._id || firstPackage?.id || '';
    form.cycle_id = firstCycle?._id || firstCycle?.id || '';
    if (firstCycle?.months) form.end_date = addMonths(form.start_date, firstCycle.months);
    setEditingClub(null);
    setFormData(form);
    setActionError('');
    setIsFormOpen(true);
  };

  const openEdit = (club) => {
    setEditingClub(club);
    setFormData({
      ...initialForm(),
      name: club.name || '',
      status: club.status === true,
    });
    setActionError('');
    setIsFormOpen(true);
  };

  const handlePackageChange = (packageId) => {
    const pkg = packages.find((item) => (item._id || item.id) === packageId);
    const cycle = pkg?.cycles?.[0];
    setFormData((current) => ({
      ...current,
      package_id: packageId,
      cycle_id: cycle?._id || cycle?.id || '',
      end_date: cycle?.months
        ? addMonths(current.start_date, cycle.months)
        : current.end_date,
    }));
  };

  const handleStartDateChange = (startDate) => {
    const selectedCycle = cycles.find(
      (cycle) => (cycle._id || cycle.id) === formData.cycle_id
    );
    setFormData((current) => ({
      ...current,
      start_date: startDate,
      end_date: selectedCycle?.months
        ? addMonths(startDate, selectedCycle.months)
        : current.end_date,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setActionError('');
    const payload = editingClub
      ? { name: formData.name.trim(), status: formData.status }
      : {
          name: formData.name.trim(),
          subdomain: formData.subdomain.trim(),
          package_id: formData.package_id,
          cycle_id: formData.cycle_id,
          start_date: new Date(`${formData.start_date}T00:00:00`).toISOString(),
          end_date: new Date(`${formData.end_date}T00:00:00`).toISOString(),
          status: formData.status,
          admin_name: formData.admin_name.trim(),
          admin_email: formData.admin_email.trim(),
          admin_password: formData.admin_password,
        };

    try {
      if (editingClub) {
        await updateClub(payload, `/api/clubs/${editingClub._id || editingClub.id}`);
        showSuccess('Club updated successfully.');
      } else {
        await createClub(payload);
        showSuccess('Club created successfully.');
      }
      setIsFormOpen(false);
      await refetch();
    } catch (saveError) {
      const message = requestError(saveError);
      setActionError(message);
      showError(message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const clubId = deleteTarget._id || deleteTarget.id;
    if (!clubId) {
      showError('This club does not have an ID and cannot be deleted.');
      return;
    }
    setActionError('');
    try {
      await deleteClub(`/api/clubs/${clubId}`);
      showSuccess('Club deleted successfully.');
      setDeleteTarget(null);
      await refetch();
    } catch (deleteError) {
      const message = requestError(deleteError);
      setActionError(message);
      showError(message);
    }
  };

  const listError = error ? requestError(error) : '';
  const packageError = packagesError ? requestError(packagesError) : '';

  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-8">
      <section className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Clubs</h2>
          <p className="mt-1 text-sm text-gray-500">Manage club tenants and their subscriptions.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="sr-only" htmlFor="clubs-search">Search clubs</label>
          <input
            id="clubs-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search clubs..."
            className="min-w-44 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <label className="sr-only" htmlFor="club-status-filter">Club status</label>
          <select
            id="club-status-filter"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All club statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <label className="sr-only" htmlFor="club-subscription-filter">Subscription status</label>
          <select
            id="club-subscription-filter"
            value={subscriptionFilter}
            onChange={(event) => {
              setSubscriptionFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All subscriptions</option>
            {['active', 'grace', 'expired', 'pending', 'inactive'].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <Button
            onClick={openCreate}
            disabled={packagesLoading || packagesWithCycles.length === 0}
          >
            Add club
          </Button>
        </div>
      </section>

      {(actionError || listError || packageError) && (
        <div role="alert" className="space-y-1 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError && <p>{actionError}</p>}
          {listError && <p>{listError}</p>}
          {packageError && <p>Packages could not be loaded: {packageError}</p>}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="font-semibold text-gray-900">Clubs</h3>
          <span className="text-xs text-gray-500">{loading ? 'Loading...' : `${clubs.length} clubs on this page`}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Club</th>
                <th className="px-5 py-3 font-semibold">Package</th>
                <th className="px-5 py-3 font-semibold">Subscription</th>
                <th className="px-5 py-3 font-semibold">Period</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="px-5 py-12 text-center"><Loader size="md" /></td></tr>
              ) : clubs.length === 0 ? (
                <tr><td colSpan="6" className="px-5 py-12 text-center text-sm text-gray-500">No clubs returned by the API.</td></tr>
              ) : clubs.map((club, index) => {
                const clubId = club._id || club.id || index;
                const active = club.status === true || club.status === 'active';
                const isDeleteTarget = deleteTarget === club;
                return (
                  <tr key={clubId} className="hover:bg-gray-50/70">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900">{club.name || '-'}</div>
                      <div className="mt-1 text-xs text-gray-500">{club.subdomain ? `@${club.subdomain}` : ''}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{club.package_id?.name || club.package?.name || '-'}</td>
                    <td className="px-5 py-4">
                      <div><StatusBadge status={club.subscription?.status || 'unknown'} /></div>
                      {club.subscription?.days_left !== undefined && club.subscription?.days_left !== null && (
                        <div className="mt-1 text-xs text-gray-500">{club.subscription.days_left} days left</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      <div>{formatDate(club.start_date)}</div>
                      <div className="mt-1 text-xs text-gray-400">{formatDate(club.end_date)}</div>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={active ? 'active' : 'inactive'} /></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(club)}>Edit</Button>
                        <Button
                          size="sm"
                          variant="danger"
                          loading={isDeleteTarget && deleting}
                          disabled={isDeleteTarget && deleting}
                          onClick={() => setDeleteTarget(club)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          <span className="text-xs text-gray-500">Page {page}{totalPages ? ` of ${totalPages}` : ''}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</Button>
            <Button size="sm" variant="outline" disabled={!canGoNext || loading} onClick={() => setPage((current) => current + 1)}>Next</Button>
          </div>
        </div>
      </section>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="club-form-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 id="club-form-title" className="text-lg font-bold text-gray-900">{editingClub ? 'Edit club' : 'Add club'}</h2>
                <p className="mt-1 text-sm text-gray-500">{editingClub ? 'Update club details.' : 'Create a club tenant and its initial administrator.'}</p>
              </div>
              <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100" aria-label="Close form">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {actionError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-medium text-gray-700">
                  Club name
                  <input required value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" />
                </label>
                {!editingClub && (
                  <label className="space-y-1 text-sm font-medium text-gray-700">
                    Subdomain
                    <input required value={formData.subdomain} onChange={(event) => setFormData({ ...formData, subdomain: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} className="w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" />
                  </label>
                )}
                <label className="space-y-1 text-sm font-medium text-gray-700">
                  Club status
                  <select value={formData.status ? 'active' : 'inactive'} onChange={(event) => setFormData({ ...formData, status: event.target.value === 'active' })} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
                {!editingClub && (
                  <>
                    <label className="space-y-1 text-sm font-medium text-gray-700">
                      Package
                      <select required value={formData.package_id} onChange={(event) => handlePackageChange(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal">
                        <option value="">Select a package</option>
                        {packagesWithCycles.map((pkg) => <option key={pkg._id || pkg.id} value={pkg._id || pkg.id}>{pkg.name}</option>)}
                      </select>
                    </label>
                    <label className="space-y-1 text-sm font-medium text-gray-700">
                      Billing cycle
                      <select required value={formData.cycle_id} onChange={(event) => {
                        const cycle = cycles.find((item) => (item._id || item.id) === event.target.value);
                        setFormData({
                          ...formData,
                          cycle_id: event.target.value,
                          end_date: cycle?.months ? addMonths(formData.start_date, cycle.months) : formData.end_date,
                        });
                      }} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-normal">
                        <option value="">Select a billing cycle</option>
                        {cycles.map((cycle, index) => <option key={cycle._id || cycle.id || index} value={cycle._id || cycle.id}>{cycle.name}</option>)}
                      </select>
                    </label>
                    <label className="space-y-1 text-sm font-medium text-gray-700">
                      Subscription starts
                      <input type="date" required value={formData.start_date} onChange={(event) => handleStartDateChange(event.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" />
                    </label>
                    <label className="space-y-1 text-sm font-medium text-gray-700">
                      Subscription ends
                      <input type="date" required value={formData.end_date} onChange={(event) => setFormData({ ...formData, end_date: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" />
                    </label>
                    <label className="space-y-1 text-sm font-medium text-gray-700">
                      Admin name
                      <input required value={formData.admin_name} onChange={(event) => setFormData({ ...formData, admin_name: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" />
                    </label>
                    <label className="space-y-1 text-sm font-medium text-gray-700">
                      Admin email
                      <input type="email" required value={formData.admin_email} onChange={(event) => setFormData({ ...formData, admin_email: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" />
                    </label>
                    <label className="space-y-1 text-sm font-medium text-gray-700 sm:col-span-2">
                      Admin password
                      <input type="password" required minLength="8" value={formData.admin_password} onChange={(event) => setFormData({ ...formData, admin_password: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 font-normal" />
                    </label>
                  </>
                )}
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit" loading={isSaving}>{editingClub ? 'Save changes' : 'Create club'}</Button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) setDeleteTarget(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="club-delete-title"
            className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-2xl"
          >
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-8 ring-red-50/50">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h2 id="club-delete-title" className="text-lg font-bold text-gray-900">Delete club?</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              Are you sure you want to delete{' '}
              <strong className="font-semibold text-gray-800">{deleteTarget.name || 'this club'}</strong>?
              This action cannot be undone.
            </p>
            {actionError && (
              <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</p>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={deleting}
                onClick={() => {
                  setActionError('');
                  setDeleteTarget(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deleting}
                disabled={deleting}
                onClick={handleDelete}
              >
                Confirm delete
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Clubs;
