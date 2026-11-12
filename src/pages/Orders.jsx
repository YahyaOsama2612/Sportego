import { useMemo, useRef, useState } from 'react';
import api from '../axios';
import StatusBadge from '../components/others/StatusBadge';
import Button from '../components/shared/Button';
import Loader from '../components/shared/Loader';
import useGet from '../hooks/useGet';
import usePost from '../hooks/usePost';
import { useToast } from '../context/ToastContext';

const pageSize = 20;

const formatAmount = (value, currency) => {
  if (value === undefined || value === null || value === '') return '-';
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return String(value);
  const amount = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(numericValue);
  return currency ? `${amount} ${currency}` : amount;
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
};

const responseMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error?.message ||
  error?.message ||
  'The request could not be completed.';

const Orders = () => {
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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderAction, setOrderAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [invoice, setInvoice] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');
  const [actionError, setActionError] = useState('');
  const invoiceRequestId = useRef(0);

  const params = useMemo(
    () => ({ page, limit: pageSize, ...(search.trim() ? { search: search.trim() } : {}) }),
    [page, search]
  );
  const {
    data: ordersResponse,
    loading,
    error,
    refetch,
  } = useGet('/api/orders', { params, immediate: true });
  const { execute: postOrderAction, loading: actionLoading } = usePost();

  const orders = useMemo(() => {
    const data = ordersResponse?.data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(ordersResponse?.items)) return ordersResponse.items;
    return Array.isArray(data) ? data : [];
  }, [ordersResponse]);

  const pagination = ordersResponse?.data?.pagination || ordersResponse?.pagination || {};
  const totalPages =
    Number(pagination.totalPages || pagination.pages) ||
    (pagination.total ? Math.ceil(Number(pagination.total) / pageSize) : 0);
  const canGoNext = totalPages ? page < totalPages : orders.length === pageSize;
  const statuses = useMemo(
    () => [...new Set(orders.map((order) => order.status).filter(Boolean))].sort(),
    [orders]
  );
  const visibleOrders =
    statusFilter === 'all'
      ? orders
      : orders.filter((order) => String(order.status).toLowerCase() === statusFilter);

  const openInvoice = async (order) => {
    const orderId = order._id || order.id;
    if (!orderId) {
      showError('This order does not have an ID for invoice lookup.');
      return;
    }

    invoiceRequestId.current += 1;
    const requestId = invoiceRequestId.current;
    setSelectedOrder(order);
    setInvoice(null);
    setInvoiceError('');
    setInvoiceLoading(true);

    try {
      const response = await api.get(`/api/orders/${orderId}/invoice`, {
        params: { format: 'json' },
      });
      if (requestId !== invoiceRequestId.current) return;
      const responseData = response.data?.data || response.data;
      const invoiceData = responseData?.invoice || responseData;
      if (!invoiceData || typeof invoiceData !== 'object' || Array.isArray(invoiceData) || !invoiceData.invoice_number) {
        setInvoiceError('Invoice data was not returned by the API.');
      } else {
        setInvoice(invoiceData);
      }
    } catch (requestError) {
      if (requestId !== invoiceRequestId.current) return;
      const message = responseMessage(requestError);
      setInvoiceError(message);
    } finally {
      if (requestId === invoiceRequestId.current) setInvoiceLoading(false);
    }
  };

  const closeInvoice = () => {
    invoiceRequestId.current += 1;
    setSelectedOrder(null);
    setInvoice(null);
    setInvoiceError('');
    setInvoiceLoading(false);
  };

  const openPrintableInvoice = async () => {
    const orderId = selectedOrder?._id || selectedOrder?.id;
    if (!orderId) return;

    const printWindow = window.open('about:blank', '_blank');
    if (!printWindow) {
      showError('Allow pop-ups to open the printable invoice.');
      return;
    }

    try {
      const response = await api.get(`/api/orders/${orderId}/invoice/html`, {
        responseType: 'text',
      });
      const invoiceUrl = URL.createObjectURL(
        new Blob([response.data], { type: 'text/html' })
      );
      printWindow.location.href = invoiceUrl;
      window.setTimeout(() => URL.revokeObjectURL(invoiceUrl), 60000);
    } catch (requestError) {
      printWindow.close();
      showError(responseMessage(requestError));
    }
  };

  const openOrderAction = (order, action) => {
    setActionError('');
    setRejectionReason('');
    setOrderAction({ order, action });
  };

  const closeOrderAction = () => {
    if (actionLoading) return;
    setOrderAction(null);
    setActionError('');
    setRejectionReason('');
  };

  const updateOrderStatus = async (event) => {
    event.preventDefault();
    if (!orderAction) return;

    const { order, action } = orderAction;
    const orderId = order._id || order.id;
    if (!orderId) {
      setActionError('This order does not have an ID.');
      return;
    }

    if (action === 'reject' && !rejectionReason.trim()) {
      setActionError('A rejection reason is required.');
      return;
    }

    const payload = action === 'reject' ? { reason: rejectionReason.trim() } : {};
    try {
      await postOrderAction(payload, {}, `/api/orders/${orderId}/${action}`);
      showSuccess(`Order ${action === 'approve' ? 'approved' : 'rejected'}.`);
      setOrderAction(null);
      setRejectionReason('');
      await refetch();
    } catch (requestError) {
      setActionError(responseMessage(requestError));
    }
  };

  const orderErrorMessage = error
    ? typeof error === 'string'
      ? error
      : error?.message || error?.error?.message || 'Orders could not be loaded.'
    : '';

  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-8">
      <section className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Orders &amp; Invoices</h2>
          <p className="mt-1 text-sm text-gray-500">
            Orders loaded from the Sportego API. Open an order to retrieve its invoice.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="sr-only" htmlFor="orders-search">Search orders</label>
          <input
            id="orders-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search orders..."
            className="min-w-44 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <label className="sr-only" htmlFor="orders-status">Filter by status</label>
          <select
            id="orders-status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={String(status).toLowerCase()}>{status}</option>
            ))}
          </select>
        </div>
      </section>

      {orderErrorMessage && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {orderErrorMessage}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-semibold text-gray-900">Orders</h3>
          <span className="text-xs text-gray-500">
            {loading ? 'Loading...' : `${visibleOrders.length} orders on this page`}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Order</th>
                <th className="px-5 py-3 font-semibold">Club</th>
                <th className="px-5 py-3 font-semibold">Package</th>
                <th className="px-5 py-3 font-semibold">Payment</th>
                <th className="px-5 py-3 font-semibold">Total</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center">
                    <Loader size="md" />
                  </td>
                </tr>
              ) : visibleOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-sm text-gray-500">
                    No orders returned by the API.
                  </td>
                </tr>
              ) : visibleOrders.map((order, index) => {
                const orderId = order._id || order.id || index;
                const isPending = String(order.status).toLowerCase() === 'pending';
                return (
                  <tr key={orderId} className="hover:bg-gray-50/70">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900">{order.order_number || orderId}</div>
                      <div className="mt-1 text-xs text-gray-500">{formatDate(order.createdAt || order.created_at)}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {order.club_id?.name || order.club?.name || '-'}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {order.package_id?.name || order.package?.name || '-'}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {order.payment_method_id?.name || order.payment_method?.name || '-'}
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {formatAmount(order.final_price ?? order.price, order.currency)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={order.status || 'unknown'} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openInvoice(order)}>
                          Invoice
                        </Button>
                        {isPending && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => openOrderAction(order, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => openOrderAction(order, 'reject')}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          <span className="text-xs text-gray-500">
            Page {page}{totalPages ? ` of ${totalPages}` : ''}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>
              Previous
            </Button>
            <Button size="sm" variant="outline" disabled={!canGoNext || loading} onClick={() => setPage((current) => current + 1)}>
              Next
            </Button>
          </div>
        </div>
      </section>

      {orderAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeOrderAction();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-action-title"
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
          >
            <form onSubmit={updateOrderStatus}>
              <div className="border-b border-gray-100 px-6 py-5">
                <h2 id="order-action-title" className="text-lg font-bold text-gray-900">
                  {orderAction.action === 'approve' ? 'Approve order' : 'Reject order'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {orderAction.action === 'approve'
                    ? `Approve ${orderAction.order.order_number || 'this order'} and mark it as paid?`
                    : `Provide a reason for rejecting ${orderAction.order.order_number || 'this order'}.`}
                </p>
              </div>
              <div className="space-y-4 p-6">
                {actionError && (
                  <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {actionError}
                  </p>
                )}
                {orderAction.action === 'reject' && (
                  <label htmlFor="order-rejection-reason" className="block text-sm font-medium text-gray-700">
                    Rejection reason
                    <textarea
                      id="order-rejection-reason"
                      autoFocus
                      required
                      rows="4"
                      value={rejectionReason}
                      onChange={(event) => setRejectionReason(event.target.value)}
                      placeholder="Explain why this order is being rejected"
                      className="mt-1.5 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </label>
                )}
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <Button type="button" variant="outline" disabled={actionLoading} onClick={closeOrderAction}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={orderAction.action === 'reject' ? 'danger' : 'primary'}
                  loading={actionLoading}
                >
                  {orderAction.action === 'approve' ? 'Approve order' : 'Reject order'}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeInvoice();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="invoice-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 id="invoice-title" className="text-lg font-bold text-gray-900">Invoice</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {invoice?.invoice_number || selectedOrder.order_number || ''}
                </p>
              </div>
              <button type="button" onClick={closeInvoice} className="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100" aria-label="Close invoice">
                &times;
              </button>
            </div>
            <div className="space-y-5 p-6">
              {invoiceLoading ? (
                <div className="flex justify-center py-10"><Loader size="md" /></div>
              ) : invoiceError ? (
                <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{invoiceError}</p>
              ) : invoice ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl bg-gray-50 p-4">
                      <div className="text-xs font-medium uppercase text-gray-500">Club</div>
                      <div className="mt-1 font-semibold text-gray-900">{invoice.club?.name || '-'}</div>
                      <div className="text-sm text-gray-500">{invoice.club?.subdomain || ''}</div>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-4">
                      <div className="text-xs font-medium uppercase text-gray-500">Invoice status</div>
                      <div className="mt-2"><StatusBadge status={invoice.status || 'unknown'} /></div>
                      <div className="mt-2 text-sm text-gray-500">{formatDate(invoice.issued_at)}</div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-900">{invoice.item?.package_name || '-'}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {[invoice.item?.game_name, invoice.item?.cycle_name].filter(Boolean).join(' · ') || '-'}
                    </p>
                    <dl className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between gap-4"><dt className="text-gray-500">Subtotal</dt><dd>{formatAmount(invoice.pricing?.subtotal, invoice.pricing?.currency)}</dd></div>
                      <div className="flex justify-between gap-4"><dt className="text-gray-500">Discount</dt><dd>{formatAmount(invoice.pricing?.discount, invoice.pricing?.currency)}</dd></div>
                      <div className="flex justify-between gap-4"><dt className="text-gray-500">Fine</dt><dd>{formatAmount(invoice.pricing?.fine, invoice.pricing?.currency)}</dd></div>
                      <div className="flex justify-between gap-4 border-t border-gray-100 pt-3 font-bold text-gray-900"><dt>Total</dt><dd>{formatAmount(invoice.pricing?.total ?? invoice.item?.final_price, invoice.pricing?.currency)}</dd></div>
                    </dl>
                  </div>
                  <div className="flex flex-wrap justify-between gap-3 text-sm text-gray-600">
                    <span>{invoice.payment?.method_name || ''}</span>
                    <span>{invoice.payment?.payment_reference || ''}</span>
                  </div>
                </>
              ) : null}
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <Button variant="outline" onClick={closeInvoice}>Close</Button>
              <Button disabled={!invoice || invoiceLoading} onClick={openPrintableInvoice}>Open printable invoice</Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Orders;
