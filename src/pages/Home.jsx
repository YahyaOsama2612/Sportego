import React, { useState, useMemo } from 'react';
import Card from '../components/shared/Card';
import Button from '../components/shared/Button';
import Loader from '../components/shared/Loader';
import GenericTable from '../components/shared/GenericTable';
import StatusBadge from '../components/others/StatusBadge';
import useGet from '../hooks/useGet';
import { useAuth } from '../context/AuthContext';

// Safe currency formatter
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const Home = () => {
  const { admin } = useAuth();
  const [selectedMonths, setSelectedMonths] = useState('');

  // Call GET /api/dashboard with optional months parameter
  const queryParams = useMemo(() => {
    return selectedMonths ? { months: parseInt(selectedMonths, 10) } : {};
  }, [selectedMonths]);

  const { data: responseData, loading, refetch } = useGet('/api/dashboard', {
    params: queryParams,
    immediate: true,
  });

  // Extract dashboard data from response { success: true, data: { ... } }
  const dashboard = responseData?.data || responseData;

  const summary = dashboard?.summary || {};

  const monthlyRevenue = dashboard?.monthly_revenue || [];
  const topPackages = dashboard?.top_packages || [];
  const recentOrders = dashboard?.recent_orders || [];
  const upcomingExpirations = dashboard?.upcoming_expirations || [];

  // Find max monthly revenue for bar chart scaling
  const maxMonthlyRevenue = useMemo(() => {
    if (!monthlyRevenue.length) return 1;
    return Math.max(...monthlyRevenue.map((m) => m.revenue || 0), 1);
  }, [monthlyRevenue]);

  // Handle month filter change
  const handleMonthsChange = (val) => {
    setSelectedMonths(val);
    refetch(val ? { months: parseInt(val, 10) } : {});
  };

  // Recent Orders table columns (strictly NO internal ID displayed)
  const orderColumns = [
    {
      key: 'order_number',
      header: 'Order #',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-bold text-primary">
          {row.order_number || 'ORD-N/A'}
        </span>
      ),
    },
    {
      key: 'club',
      header: 'Club',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-gray-900 block">{row.club_id?.name || 'Club'}</span>
          {row.club_id?.subdomain && (
            <span className="text-[11px] text-gray-400">@{row.club_id.subdomain}</span>
          )}
        </div>
      ),
    },
    {
      key: 'package',
      header: 'Package / Plan',
      render: (row) => {
        if (row.package_id?.name) {
          return <span className="font-medium text-gray-800">{row.package_id.name}</span>;
        }
        if (row.items && row.items.length > 0) {
          return (
            <span className="text-xs text-gray-700">
              {row.items.length} {row.items.length === 1 ? 'Package' : 'Packages'}
            </span>
          );
        }
        return <span className="text-gray-400">-</span>;
      },
    },
    {
      key: 'payment_method',
      header: 'Payment Method',
      render: (row) => (
        <span className="text-xs font-medium text-gray-600">
          {row.payment_method_id?.name || 'Standard'}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Final Price',
      sortable: true,
      align: 'right',
      render: (row) => (
        <span className="font-bold text-gray-900 font-mono">
          {formatCurrency(row.final_price || row.price)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} label={row.status} />,
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-gray-500">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Welcome & Filters Header */}
      <div className="rounded-2xl bg-gradient-to-r from-primary via-purple-700 to-indigo-800 p-6 sm:p-8 text-white shadow-xl shadow-primary/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur">
                Live Metrics
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                ● Synced
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {admin?.name || 'Administrator'}
            </h2>
            <p className="mt-1.5 text-purple-100 text-sm max-w-2xl leading-relaxed">
              Real-time platform overview of clubs, subscription revenue, packages, and recent order activity.
            </p>
          </div>

          {/* Months Query Filter & Refresh */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/20 flex items-center">
              <span className="text-xs text-purple-200 px-2.5 font-medium">Period:</span>
              <select
                value={selectedMonths}
                onChange={(e) => handleMonthsChange(e.target.value)}
                className="bg-white text-gray-900 rounded-lg text-xs font-semibold px-3 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="">All Time</option>
                <option value="6">Last 6 Months</option>
                <option value="12">Last 12 Months</option>
              </select>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch(queryParams)}
              disabled={loading}
              className="bg-white text-primary hover:bg-purple-50 font-bold shadow-md"
            >
              {loading ? 'Refreshing...' : '↻ Refresh'}
            </Button>
          </div>
        </div>
      </div>

      {loading && !dashboard && (
        <div className="py-12 flex flex-col items-center justify-center">
          <Loader size="lg" />
          <p className="text-xs text-gray-400 mt-3 font-medium">Loading dashboard data...</p>
        </div>
      )}

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Revenue</span>
            <div className="p-2 rounded-xl bg-primary-50 text-primary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">
              {formatCurrency(summary.revenue?.total)}
            </h3>
            <p className="text-xs text-gray-500 mt-1 flex items-center justify-between">
              <span>{summary.revenue?.paid_orders || 0} paid orders</span>
              <span className="font-semibold text-amber-600">
                Pending: {formatCurrency(summary.revenue?.pending)}
              </span>
            </p>
          </div>
        </div>

        {/* Clubs Directory Status */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Registered Clubs</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">
              {summary.clubs || 0} Clubs
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-emerald-600 font-semibold">
                {summary.clubs_by_status?.active || 0} active
              </span>
              <span>•</span>
              <span className="text-amber-600">
                {summary.clubs_by_status?.grace || 0} grace
              </span>
              <span>•</span>
              <span className="text-red-500">
                {summary.clubs_by_status?.expired || 0} expired
              </span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Orders</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">
              {summary.orders || 0} Orders
            </h3>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
              <span className="text-amber-600 font-semibold">{summary.orders_by_status?.pending || 0} pending</span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold">{summary.orders_by_status?.paid || 0} paid</span>
            </p>
          </div>
        </div>

        {/* Packages & Games */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Catalog & Sports</span>
            <div className="p-2 rounded-xl bg-primary-50 text-primary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">
              {summary.packages || 0} Packages
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Across <strong className="text-primary font-semibold">{summary.games || 0} sports games</strong> ({summary.actions || 0} actions)
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Visual Bar Graph */}
      {monthlyRevenue.length > 0 && (
        <Card
          title="📈 Monthly Revenue Performance"
          subtitle="Revenue trend and order volume across recorded billing months"
        >
          <div className="pt-6 pb-2">
            <div className="flex items-end justify-between gap-2 h-48 sm:h-56">
              {monthlyRevenue.map((item) => {
                const heightPercent =
                  item.revenue > 0
                    ? Math.max(Math.round((item.revenue / maxMonthlyRevenue) * 100), 12)
                    : 6;

                return (
                  <div
                    key={item.month}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-gray-900 text-white text-[11px] font-medium py-1.5 px-2.5 rounded-lg shadow-xl whitespace-nowrap z-20 pointer-events-none">
                      <span className="font-bold text-primary-200">{formatCurrency(item.revenue)}</span>
                      <span className="text-gray-300 text-[10px]">{item.orders} orders ({item.month})</span>
                      <div className="w-2 h-2 bg-gray-900 transform rotate-45 -mb-1 mt-0.5" />
                    </div>

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[42px] rounded-t-lg transition-all duration-500 ${
                        item.revenue > 0
                          ? 'bg-gradient-to-t from-primary to-purple-500 group-hover:from-primary-hover group-hover:to-purple-400 shadow-xs'
                          : 'bg-gray-100 group-hover:bg-gray-200'
                      }`}
                    />

                    {/* Month Label */}
                    <span className="text-[10px] text-gray-400 font-semibold mt-2.5 block truncate max-w-full">
                      {item.month.split('-')[1]}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100 text-xs text-gray-400 font-medium">
              <span>Timeline View (Monthly)</span>
              <span className="text-primary font-semibold">Peak Month: {formatCurrency(maxMonthlyRevenue)}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Two Column Grid: Top Packages & Upcoming Expirations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Packages */}
        <Card
          title="🏆 Top Performing Packages"
          subtitle="Packages with highest subscription demand and revenue"
        >
          <div className="space-y-3.5 mt-2">
            {topPackages.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No package statistics available</p>
            ) : (
              topPackages.map((pkg, idx) => (
                <div
                  key={pkg.package_id || idx}
                  className="flex items-center justify-between p-3.5 bg-gray-50/70 rounded-xl border border-gray-100 hover:border-primary-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary font-black text-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{pkg.name}</h4>
                      <p className="text-xs text-gray-500 font-medium">{pkg.orders} total orders</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-primary">
                      {formatCurrency(pkg.revenue)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Upcoming Expirations */}
        <Card
          title="⚠️ Upcoming Club Expirations"
          subtitle="Clubs whose package subscriptions are expiring soon"
        >
          <div className="space-y-3.5 mt-2">
            {upcomingExpirations.length === 0 ? (
              <div className="p-6 text-center text-xs text-emerald-600 bg-emerald-50 rounded-xl font-medium">
                No memberships expiring in the immediate window!
              </div>
            ) : (
              upcomingExpirations.map((exp, idx) => (
                <div
                  key={exp._id || idx}
                  className="flex items-center justify-between p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/60"
                >
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">{exp.name}</h4>
                    <p className="text-xs text-gray-500">
                      Package: <span className="font-semibold text-gray-700">{exp.package_id?.name || 'Active Plan'}</span>
                    </p>
                    {exp.end_date && (
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Expires: {new Date(exp.end_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-bold shadow-xs whitespace-nowrap">
                    {exp.days_left} {exp.days_left === 1 ? 'day' : 'days'} left
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Recent Orders GenericTable Section */}
      <section className="space-y-4">
        <GenericTable
          title="Recent Orders"
          columns={orderColumns}
          data={recentOrders}
          pageSize={5}
          searchable={true}
          pagination={true}
        />
      </section>
    </div>
  );
};

export default Home;
