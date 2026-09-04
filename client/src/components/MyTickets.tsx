import React, { useState, useEffect, useCallback } from "react";
import {
  getTickets,
  getCategories,
  Ticket,
  Category,
  PaginationMetadata,
} from "../api.js";
import { useRequester } from "../context/RequesterContext.js";

interface MyTicketsProps {
  onCreateTicket?: () => void;
  onSelectTicket?: (ticketId: number) => void;
}

export default function MyTickets({ onCreateTicket, onSelectTicket }: MyTicketsProps) {
  const { currentRequester } = useRequester();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Query State
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load categories for filter dropdown
  useEffect(() => {
    async function loadCats() {
      try {
        const cats = await getCategories();
        setCategories(cats);
      } catch {
        // Non-critical, filter will simply have fewer options
      }
    }
    loadCats();
  }, []);

  // Fetch tickets whenever query parameters or active requester changes
  const fetchTickets = useCallback(async () => {
    if (!currentRequester) return;

    setLoading(true);
    setError(null);

    try {
      const res = await getTickets(
        {
          search: debouncedSearch.trim() || undefined,
          categoryId: categoryId ? Number(categoryId) : undefined,
          priority: priority || undefined,
          status: status || undefined,
          sortBy,
          sortOrder,
          page,
          pageSize,
        },
        currentRequester.id
      );

      setTickets(res.data);
      setPagination(res.pagination);
    } catch (err) {
      console.error("Failed to load tickets:", err);
      setError("Failed to load tickets. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [currentRequester, debouncedSearch, categoryId, priority, status, sortBy, sortOrder, page, pageSize]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Reset all filters
  function handleClearFilters() {
    setSearch("");
    setDebouncedSearch("");
    setCategoryId("");
    setPriority("");
    setStatus("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  }

  // Handle column header sort toggle
  function handleSort(column: string) {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setPage(1);
  }

  const isFilterActive =
    search.trim() !== "" ||
    categoryId !== "" ||
    priority !== "" ||
    status !== "" ||
    sortBy !== "createdAt" ||
    sortOrder !== "desc";

  // Priority Badge Helper
  function renderPriorityBadge(p: string) {
    const upper = (p || "MEDIUM").toUpperCase();
    let badgeClass = "badge-priority-medium";
    if (upper === "LOW") badgeClass = "badge-priority-low";
    if (upper === "HIGH") badgeClass = "badge-priority-high";
    if (upper === "URGENT") badgeClass = "badge-priority-urgent";

    return <span className={badgeClass}>{upper}</span>;
  }

  // Status Badge Helper
  function renderStatusBadge(s: string) {
    const norm = (s || "New").toLowerCase();
    let badgeClass = "badge-status-new";
    if (norm === "open") badgeClass = "badge-status-open";
    if (norm === "in progress") badgeClass = "badge-status-inprogress";
    if (norm === "resolved") badgeClass = "badge-status-resolved";
    if (norm === "closed") badgeClass = "badge-status-closed";

    return <span className={badgeClass}>{s}</span>;
  }

  // Format Date Helper
  function formatDate(dateStr: string) {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="my-tickets-container">
      {/* Header Bar */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold mb-1" style={{ color: "var(--color-primary-green)" }}>
            My Tickets
          </h1>
          <p className="text-muted small mb-0">
            Viewing tickets submitted by <strong>{currentRequester?.name}</strong> (
            {pagination ? `${pagination.totalItems} total` : "Loading..."})
          </p>
        </div>

        {onCreateTicket && (
          <button
            type="button"
            className="btn btn-zen-primary d-inline-flex align-items-center gap-2"
            onClick={onCreateTicket}
          >
            <span>➕</span>
            <span>Create Ticket</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="zen-card p-3 mb-4">
        <div className="row g-2 align-items-center">
          {/* Keyword Search */}
          <div className="col-12 col-lg-4">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted" id="search-addon">
                🔍
              </span>
              <input
                type="text"
                className="form-control zen-input border-start-0"
                placeholder="Search by Ticket # or Summary..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search tickets"
                aria-describedby="search-addon"
              />
              {search && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setSearch("")}
                  title="Clear search text"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          <div className="col-6 col-md-3 col-lg-2">
            <select
              className="form-select zen-select"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by Category"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="col-6 col-md-3 col-lg-2">
            <select
              className="form-select zen-select"
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by Priority"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="col-6 col-md-3 col-lg-2">
            <select
              className="form-select zen-select"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by Status"
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="col-6 col-md-3 col-lg-2 d-flex justify-content-end">
            <button
              type="button"
              className="btn btn-zen-secondary w-100"
              onClick={handleClearFilters}
              disabled={!isFilterActive}
            >
              🔄 Clear
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center mb-4" role="alert">
          <div>
            <strong>Error:</strong> {error}
          </div>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={fetchTickets}>
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton / Spinner */}
      {loading && (
        <div className="zen-card p-5 text-center my-4">
          <div className="spinner-border text-success mb-3" role="status" style={{ width: "2.5rem", height: "2.5rem" }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mb-0">Loading your tickets...</p>
        </div>
      )}

      {/* Empty State (No tickets ever submitted) */}
      {!loading && !error && tickets.length === 0 && !isFilterActive && (
        <div className="zen-card p-5 text-center my-4">
          <div className="fs-1 mb-3">🎫</div>
          <h2 className="h4 fw-bold mb-2">You haven't submitted any IT tickets yet</h2>
          <p className="text-muted mx-auto mb-4" style={{ maxWidth: 450 }}>
            Need help with hardware, software access, or IT services? Click the button below to submit your first ticket.
          </p>
          <button
            type="button"
            className="btn btn-zen-primary px-4 py-2"
            onClick={onCreateTicket}
          >
            ➕ Create Your First Ticket
          </button>
        </div>
      )}

      {/* No Results State (Search/Filters yield 0) */}
      {!loading && !error && tickets.length === 0 && isFilterActive && (
        <div className="zen-card p-5 text-center my-4">
          <div className="fs-1 mb-3">🔍</div>
          <h2 className="h4 fw-bold mb-2">No tickets match your search filters</h2>
          <p className="text-muted mx-auto mb-4" style={{ maxWidth: 450 }}>
            Try adjusting your search terms, changing priority/category filters, or clear all filters to see your full list.
          </p>
          <button type="button" className="btn btn-zen-secondary px-4 py-2" onClick={handleClearFilters}>
            🔄 Clear All Filters
          </button>
        </div>
      )}

      {/* Main Tickets List View */}
      {!loading && !error && tickets.length > 0 && (
        <>
          {/* Desktop Table View (>= 768px) */}
          <div className="zen-card mb-4 d-none d-md-block overflow-hidden">
            <div className="table-responsive">
              <table className="zen-table table mb-0 align-middle">
                <thead>
                  <tr>
                    <th
                      style={{ cursor: "pointer", width: "16%" }}
                      onClick={() => handleSort("ticketNumber")}
                      title="Sort by Ticket Number"
                    >
                      Ticket No. {sortBy === "ticketNumber" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th
                      style={{ cursor: "pointer", width: "18%" }}
                      onClick={() => handleSort("createdAt")}
                      title="Sort by Created Date"
                    >
                      Created Date {sortBy === "createdAt" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th style={{ width: "26%" }}>Summary</th>
                    <th style={{ width: "12%" }}>Category</th>
                    <th
                      style={{ cursor: "pointer", width: "10%" }}
                      onClick={() => handleSort("requestedPriority")}
                      title="Sort by Priority"
                    >
                      Priority {sortBy === "requestedPriority" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th style={{ width: "10%" }}>Status</th>
                    <th style={{ width: "8%" }} className="text-center">Files</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="zen-table-row"
                      style={{ cursor: onSelectTicket ? "pointer" : "default" }}
                      onClick={() => onSelectTicket && onSelectTicket(ticket.id)}
                    >
                      <td>
                        <button
                          type="button"
                          className="btn btn-link p-0 text-decoration-none fw-bold"
                          style={{ color: "var(--color-primary-green)" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectTicket) onSelectTicket(ticket.id);
                          }}
                        >
                          {ticket.ticketNumber}
                        </button>
                      </td>
                      <td className="text-muted small">{formatDate(ticket.createdAt)}</td>
                      <td>
                        <div className="fw-semibold text-truncate" style={{ maxWidth: 280 }} title={ticket.summary}>
                          {ticket.summary}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {ticket.category?.name || "General"}
                        </span>
                      </td>
                      <td>{renderPriorityBadge(ticket.requestedPriority)}</td>
                      <td>{renderStatusBadge(ticket.status)}</td>
                      <td className="text-center">
                        {ticket.attachmentCount && ticket.attachmentCount > 0 ? (
                          <span className="badge bg-light text-muted border" title={`${ticket.attachmentCount} active attachments`}>
                            📎 {ticket.attachmentCount}
                          </span>
                        ) : (
                          <span className="text-muted small">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View (< 768px) */}
          <div className="d-block d-md-none mb-4">
            <div className="d-flex flex-column gap-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="zen-card p-3 shadow-sm"
                  style={{ cursor: onSelectTicket ? "pointer" : "default" }}
                  onClick={() => onSelectTicket && onSelectTicket(ticket.id)}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold" style={{ color: "var(--color-primary-green)" }}>
                      {ticket.ticketNumber}
                    </span>
                    <div className="d-flex gap-1">
                      {renderPriorityBadge(ticket.requestedPriority)}
                      {renderStatusBadge(ticket.status)}
                    </div>
                  </div>

                  <h3 className="h6 fw-semibold mb-2">{ticket.summary}</h3>

                  <div className="d-flex justify-content-between align-items-center text-muted small pt-2 border-top">
                    <span>📁 {ticket.category?.name || "General"}</span>
                    <span>🕒 {formatDate(ticket.createdAt)}</span>
                  </div>

                  {ticket.attachmentCount && ticket.attachmentCount > 0 ? (
                    <div className="mt-2 text-muted small">
                      📎 {ticket.attachmentCount} active attachment{ticket.attachmentCount > 1 ? "s" : ""}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Controls */}
          {pagination && (
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 py-2">
              <div className="text-muted small">
                Showing <strong>{(pagination.page - 1) * pagination.pageSize + 1}</strong> to{" "}
                <strong>{Math.min(pagination.page * pagination.pageSize, pagination.totalItems)}</strong> of{" "}
                <strong>{pagination.totalItems}</strong> tickets
              </div>

              <div className="d-flex align-items-center gap-3">
                {/* Page Size Selector */}
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted small">Per page:</span>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: "auto" }}
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    aria-label="Items per page"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                  </select>
                </div>

                {/* Pagination Nav */}
                <nav aria-label="Ticket list pagination">
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${!pagination.hasPrevPage ? "disabled" : ""}`}>
                      <button
                        type="button"
                        className="page-link"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={!pagination.hasPrevPage}
                        aria-label="Previous page"
                      >
                        « Prev
                      </button>
                    </li>

                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <li key={pageNum} className={`page-item ${pageNum === pagination.page ? "active" : ""}`}>
                        <button
                          type="button"
                          className="page-link"
                          onClick={() => setPage(pageNum)}
                          aria-label={`Go to page ${pageNum}`}
                        >
                          {pageNum}
                        </button>
                      </li>
                    ))}

                    <li className={`page-item ${!pagination.hasNextPage ? "disabled" : ""}`}>
                      <button
                        type="button"
                        className="page-link"
                        onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                        disabled={!pagination.hasNextPage}
                        aria-label="Next page"
                      >
                        Next »
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
