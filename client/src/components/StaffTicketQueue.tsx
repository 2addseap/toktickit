import React, { useState, useEffect, useCallback } from "react";
import {
  StaffTicket,
  StaffAssignee,
  Category,
  PaginationMetadata,
  getStaffTickets,
  getStaffAssignees,
  getCategories,
} from "../api.js";

interface StaffTicketQueueProps {
  onSelectTicket?: (ticketId: number) => void;
}

export default function StaffTicketQueue({ onSelectTicket }: StaffTicketQueueProps) {
  const [tickets, setTickets] = useState<StaffTicket[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata>({
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [assignees, setAssignees] = useState<StaffAssignee[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [assignedToFilter, setAssignedToFilter] = useState<string>("");
  const [unassignedOnly, setUnassignedOnly] = useState<boolean>(false);

  // Sorting State
  const [sortBy, setSortBy] = useState<"createdAt" | "ticketNumber" | "itPriority" | "status" | "updatedAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Page State
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Load auxiliary data (categories and assignees)
  useEffect(() => {
    async function loadAux() {
      try {
        const [cats, staff] = await Promise.all([
          getCategories().catch(() => []),
          getStaffAssignees().catch(() => []),
        ]);
        setCategories(cats);
        setAssignees(staff);
      } catch (err) {
        console.error("Failed to load categories/staff:", err);
      }
    }
    loadAux();
  }, []);

  // Fetch Tickets
  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const assignedParam = unassignedOnly
        ? "unassigned"
        : assignedToFilter || undefined;

      const res = await getStaffTickets({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        categoryId: categoryFilter ? Number(categoryFilter) : undefined,
        assignedTo: assignedParam,
        sortBy,
        sortOrder,
        page,
        pageSize,
      });

      setTickets(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err.message || "Failed to load ticket queue.");
    } finally {
      setIsLoading(false);
    }
  }, [
    search,
    statusFilter,
    priorityFilter,
    categoryFilter,
    assignedToFilter,
    unassignedOnly,
    sortBy,
    sortOrder,
    page,
    pageSize,
  ]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleSort = (field: "createdAt" | "ticketNumber" | "itPriority" | "status" | "updatedAt") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setCategoryFilter("");
    setAssignedToFilter("");
    setUnassignedOnly(false);
    setPage(1);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "New":
        return <span className="badge-status-new">New</span>;
      case "Open":
        return <span className="badge-status-open">Open</span>;
      case "In Progress":
        return <span className="badge-status-inprogress">In Progress</span>;
      case "Waiting for Requester":
        return <span className="badge bg-warning-subtle text-dark border border-warning-subtle px-2 py-1 rounded">Waiting</span>;
      case "Resolved":
        return <span className="badge-status-resolved">Resolved</span>;
      case "Closed":
        return <span className="badge-status-closed">Closed</span>;
      default:
        return <span className="badge bg-secondary px-2 py-1 rounded">{status}</span>;
    }
  };

  const renderPriorityBadge = (p: string) => {
    const priority = p.toUpperCase();
    switch (priority) {
      case "LOW":
        return <span className="badge-priority-low">LOW</span>;
      case "MEDIUM":
        return <span className="badge-priority-medium">MEDIUM</span>;
      case "HIGH":
        return <span className="badge-priority-high">HIGH</span>;
      case "URGENT":
        return <span className="badge-priority-urgent">URGENT</span>;
      default:
        return <span className="badge bg-secondary">{priority}</span>;
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return "↕️";
    return sortOrder === "asc" ? "▲" : "▼";
  };

  return (
    <div className="staff-ticket-queue-container" data-testid="staff-ticket-queue-screen">
      {/* Header Strip */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div className="d-flex align-items-center gap-3">
          <h2 className="fw-bold mb-0 text-dark">IT Staff Ticket Queue</h2>
          <span className="badge bg-secondary rounded-pill fs-6 px-3 py-1" data-testid="queue-count-badge">
            {pagination.totalItems} {pagination.totalItems === 1 ? "ticket" : "tickets"}
          </span>
        </div>
      </div>

      {/* Main Card with Controls & Filters */}
      <div className="zen-card p-4 mb-4">
        {/* Search & Main Controls */}
        <div className="row g-3 mb-3">
          <div className="col-12 col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted">🔍</span>
              <input
                type="text"
                className="form-control zen-input border-start-0"
                placeholder="Search ticket number or summary..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                data-testid="queue-search-input"
              />
              {search && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="col-12 col-md-6 d-flex align-items-center justify-content-md-end gap-2">
            <button
              type="button"
              className={`btn btn-sm ${unassignedOnly ? "btn-zen-primary" : "btn-zen-secondary"}`}
              onClick={() => {
                setUnassignedOnly(!unassignedOnly);
                setAssignedToFilter("");
                setPage(1);
              }}
              data-testid="toggle-unassigned-btn"
            >
              {unassignedOnly ? "✓ Unassigned Only" : "Unassigned Only"}
            </button>
            {(search || statusFilter || priorityFilter || categoryFilter || assignedToFilter || unassignedOnly) && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={handleClearFilters}
                data-testid="clear-queue-filters-btn"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Detailed Filter Dropdowns */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold text-muted mb-1">Status</label>
            <select
              className="form-select zen-select form-select-sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              data-testid="queue-status-filter"
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting for Requester">Waiting for Requester</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold text-muted mb-1">IT Priority</label>
            <select
              className="form-select zen-select form-select-sm"
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              data-testid="queue-priority-filter"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold text-muted mb-1">Category</label>
            <select
              className="form-select zen-select form-select-sm"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              data-testid="queue-category-filter"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold text-muted mb-1">Assignee</label>
            <select
              className="form-select zen-select form-select-sm"
              value={assignedToFilter}
              disabled={unassignedOnly}
              onChange={(e) => {
                setAssignedToFilter(e.target.value);
                setPage(1);
              }}
              data-testid="queue-assignee-filter"
            >
              <option value="">All Staff</option>
              {assignees.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role === "ADMINISTRATOR" ? "Admin" : "Staff"})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading ticket queue...</span>
            </div>
            <p className="text-muted mt-2">Loading ticket queue...</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* Desktop Data Table (Visible on lg and up) */}
        {!isLoading && !error && tickets.length > 0 && (
          <div className="d-none d-lg-block table-responsive">
            <table className="zen-table table-hover align-middle" data-testid="queue-table">
              <thead>
                <tr>
                  <th style={{ cursor: "pointer" }} onClick={() => handleSort("ticketNumber")}>
                    Ticket No. <span className="small">{getSortIcon("ticketNumber")}</span>
                  </th>
                  <th style={{ cursor: "pointer" }} onClick={() => handleSort("createdAt")}>
                    Created <span className="small">{getSortIcon("createdAt")}</span>
                  </th>
                  <th>Summary</th>
                  <th>Category</th>
                  <th>Req. Priority</th>
                  <th style={{ cursor: "pointer" }} onClick={() => handleSort("itPriority")}>
                    IT Priority <span className="small">{getSortIcon("itPriority")}</span>
                  </th>
                  <th style={{ cursor: "pointer" }} onClick={() => handleSort("status")}>
                    Status <span className="small">{getSortIcon("status")}</span>
                  </th>
                  <th>Assigned To</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    className="zen-table-row"
                    data-testid={`queue-row-${t.id}`}
                    style={{ cursor: onSelectTicket ? "pointer" : "default" }}
                    onClick={() => onSelectTicket && onSelectTicket(t.id)}
                  >
                    <td className="fw-bold text-dark font-monospace">{t.ticketNumber}</td>
                    <td className="text-muted small">
                      {new Date(t.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="fw-semibold text-dark text-truncate" style={{ maxWidth: "240px" }} title={t.summary}>
                      {t.summary}
                      {t.resolvedIndicated && (
                        <span className="ms-2 badge bg-success-subtle text-success small" title="Requester indicated problem resolved">
                          ✓ Resolved?
                        </span>
                      )}
                    </td>
                    <td>{t.category?.name || "—"}</td>
                    <td>{renderPriorityBadge(t.requestedPriority)}</td>
                    <td>{renderPriorityBadge(t.itPriority)}</td>
                    <td>{renderStatusBadge(t.status)}</td>
                    <td>
                      {t.assignedTo ? (
                        <span className="fw-medium text-dark d-inline-flex align-items-center gap-1">
                          👤 {t.assignedTo.name}
                        </span>
                      ) : (
                        <span className="badge bg-light text-muted border px-2 py-1 rounded" data-testid="unassigned-pill">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectTicket) onSelectTicket(t.id);
                        }}
                        data-testid={`view-ticket-btn-${t.id}`}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Mobile Card View (Visible on < lg) */}
        {!isLoading && !error && tickets.length > 0 && (
          <div className="d-lg-none d-flex flex-column gap-3" data-testid="queue-mobile-cards">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="card border p-3 shadow-sm"
                data-testid={`queue-card-${t.id}`}
                style={{ cursor: onSelectTicket ? "pointer" : "default" }}
                onClick={() => onSelectTicket && onSelectTicket(t.id)}
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="fw-bold font-monospace text-dark">{t.ticketNumber}</span>
                  {renderStatusBadge(t.status)}
                </div>
                <h6 className="fw-bold text-dark mb-2">{t.summary}</h6>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  <span className="badge bg-light text-dark border">{t.category?.name || "Uncategorized"}</span>
                  <span className="small text-muted d-flex align-items-center gap-1">
                    IT Priority: {renderPriorityBadge(t.itPriority)}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center pt-2 border-top text-muted small">
                  <div>
                    {t.assignedTo ? (
                      <span>👤 {t.assignedTo.name}</span>
                    ) : (
                      <span className="badge bg-light text-muted border">Unassigned</span>
                    )}
                  </div>
                  <div>
                    {new Date(t.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && tickets.length === 0 && (
          <div className="text-center py-5" data-testid="no-tickets-message">
            <p className="fs-5 text-muted mb-2">No tickets found in the queue.</p>
            <p className="text-muted small mb-3">Try adjusting your filters, search term, or unassigned toggle.</p>
            {(search || statusFilter || priorityFilter || categoryFilter || assignedToFilter || unassignedOnly) && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={handleClearFilters}
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Pagination Footer */}
        {!isLoading && !error && tickets.length > 0 && (
          <div className="d-flex flex-wrap justify-content-between align-items-center mt-4 pt-3 border-top gap-3">
            <div className="d-flex align-items-center gap-2">
              <span className="text-muted small">Rows per page:</span>
              <select
                className="form-select form-select-sm"
                style={{ width: "70px" }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                data-testid="page-size-selector"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-muted small ms-2">
                Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} total)
              </span>
            </div>

            <div className="btn-group btn-group-sm">
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage(page - 1)}
                data-testid="prev-page-btn"
              >
                ← Prev
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage(page + 1)}
                data-testid="next-page-btn"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
