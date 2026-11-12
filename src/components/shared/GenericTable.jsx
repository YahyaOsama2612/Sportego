import { useState, useMemo } from 'react';
import Loader from './Loader';
import Button from './Button';

/**
 * GenericTable Component with resilient error safeguards
 * @param {Array} columns - [{ key, header, accessor, render, sortable, align, width }]
 * @param {Array} data - Array of record objects
 * @param {boolean} loading - Displays loading spinner
 * @param {string} emptyMessage - Message when no data is present
 * @param {function} onRowClick - Optional row click handler
 * @param {boolean} pagination - Enable client-side pagination
 * @param {number} pageSize - Number of rows per page
 * @param {boolean} searchable - Show search input
 * @param {string} title - Optional title above table
 * @param {ReactNode} actions - Optional actions in table header
 * @param {string} keyField - Unique identifier property (default: 'id')
 */
const GenericTable = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found',
  onRowClick,
  pagination = true,
  pageSize = 5,
  searchable = true,
  title,
  actions,
  keyField = 'id',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const searchValue = searchTerm.trim();
  const [paginationState, setPaginationState] = useState({ page: 1, search: '' });
  const currentPage = paginationState.search === searchValue ? paginationState.page : 1;
  const setCurrentPage = (nextPage) => {
    setPaginationState({
      page: typeof nextPage === 'function' ? nextPage(currentPage) : nextPage,
      search: searchValue,
    });
  };

  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const safeColumns = useMemo(() => (Array.isArray(columns) ? columns : []), [columns]);

  // Sorting Handler
  const handleSort = (column) => {
    if (!column || !column.sortable) return;
    const key = column.key || column.accessor;
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        return { key: null, direction: 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Filtered & Sorted Data
  const processedData = useMemo(() => {
    let result = [...safeData];

    // Search filter
    const searchTerms = searchValue ? [searchValue.toLowerCase()] : [];
    if (searchable && searchTerms.length > 0) {
      result = result.filter((item) => {
        if (!item || typeof item !== 'object') return false;
        return searchTerms.every((term) =>
          safeColumns.some((col) => {
            try {
              const val =
                typeof col.accessor === 'function'
                  ? col.accessor(item)
                  : item[col.accessor || col.key];
              return val !== undefined && val !== null && String(val).toLowerCase().includes(term);
            } catch {
              return false;
            }
          })
        );
      });
    }

    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (!a || !b) return 0;
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA === valB) return 0;
        if (valA == null) return 1;
        if (valB == null) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        }

        const comp = String(valA).localeCompare(String(valB));
        return sortConfig.direction === 'asc' ? comp : -comp;
      });
    }

    return result;
  }, [safeData, safeColumns, searchValue, searchable, sortConfig]);

  // Pagination calculation
  const totalPages = Math.ceil(processedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    if (!pagination) return processedData;
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, pagination, currentPage, pageSize]);

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Table Header Bar */}
      {(title || searchable || actions) && (
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {title && <h3 className="text-base sm:text-lg font-bold text-gray-900">{title}</h3>}
            <p className="text-xs text-gray-500 mt-0.5">
              Showing {processedData.length} total {processedData.length === 1 ? 'record' : 'records'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {searchable && (
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Filter records..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-3 text-xs sm:text-sm text-gray-900 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            )}
            {actions}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-primary-50/60 text-xs uppercase tracking-wider text-primary font-semibold border-b border-primary-100">
            <tr>
              {safeColumns.map((col, idx) => {
                const key = col.key || col.accessor || idx;
                const isSorted = sortConfig.key === (col.key || col.accessor);

                return (
                  <th
                    key={key}
                    style={{ width: col.width }}
                    onClick={() => handleSort(col)}
                    className={`px-4 sm:px-6 py-3.5 select-none ${
                      col.sortable ? 'cursor-pointer hover:bg-primary-100/50 transition-colors' : ''
                    } ${
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'right'
                        ? 'text-right'
                        : 'text-left'
                    }`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === 'center'
                          ? 'justify-center'
                          : col.align === 'right'
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-primary-400">
                          {isSorted ? (
                            sortConfig.direction === 'asc' ? (
                              <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                  fillRule="evenodd"
                                  d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                  fillRule="evenodd"
                                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )
                          ) : (
                            <svg className="w-3.5 h-3.5 opacity-40 hover:opacity-100" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M5 8l5-5 5 5H5zM5 12l5 5 5-5H5z" />
                            </svg>
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={Math.max(safeColumns.length, 1)} className="py-12 text-center">
                  <Loader size="md" />
                  <p className="mt-2 text-xs text-gray-400">Loading data...</p>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={Math.max(safeColumns.length, 1)} className="py-12 text-center text-gray-400 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => {
                if (!row) return null;
                const rowKey = row[keyField] ?? rowIdx;
                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick && onRowClick(row, rowIdx)}
                    className={`transition-colors ${
                      onRowClick ? 'cursor-pointer hover:bg-primary-50/40' : 'hover:bg-gray-50/70'
                    }`}
                  >
                    {safeColumns.map((col, colIdx) => {
                      const cellKey = `${rowKey}-${col.key || col.accessor || colIdx}`;
                      let renderedContent = '-';
                      try {
                        if (col.render) {
                          renderedContent = col.render(row, rowIdx);
                        } else {
                          const rawValue =
                            typeof col.accessor === 'function'
                              ? col.accessor(row)
                              : row[col.accessor || col.key];
                          renderedContent = rawValue ?? '-';
                        }
                      } catch (renderErr) {
                        console.error('Column render error:', renderErr);
                        renderedContent = '-';
                      }

                      return (
                        <td
                          key={cellKey}
                          className={`px-4 sm:px-6 py-3.5 text-sm ${
                            col.align === 'center'
                              ? 'text-center'
                              : col.align === 'right'
                              ? 'text-right'
                              : 'text-left'
                          }`}
                        >
                          {renderedContent}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && !loading && processedData.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-gray-100 px-4 py-3 sm:px-6 gap-3">
          <div className="text-xs text-gray-500">
            Page <span className="font-semibold text-gray-800">{currentPage}</span> of{' '}
            <span className="font-semibold text-gray-800">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
                .map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      currentPage === pageNumber
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-primary-50 hover:text-primary'
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenericTable;
