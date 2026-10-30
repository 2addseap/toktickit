import { useState, useEffect, useCallback } from "react";
import { getRequesterDashboard, RequesterDashboardData } from "../api.js";
import { useAuth } from "../context/AuthContext.js";
import { useRequester } from "../context/RequesterContext.js";

interface RequesterDashboardProps {
  onCreateTicket: () => void;
  onSelectTicket: (ticketId: number) => void;
  onViewAllTickets: (filter?: string) => void;
}

export default function RequesterDashboard({
  onCreateTicket,
  onSelectTicket,
  onViewAllTickets,
}: RequesterDashboardProps) {
  const { currentUser } = useAuth();
  const { currentRequester } = useRequester();
  const [data, setData] = useState<RequesterDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const displayName = currentUser?.name || currentRequester?.name || "Requester";

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getRequesterDashboard();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "New":
        return <span className="badge-status-new">New</span>;
      case "Open":
        return <span className="badge-status-open">Open</span>;
      case "In Progress":
        return <span className="badge-status-inprogress">In Progress</span>;
      case "Waiting for Requester":
        return <span className="badge-status-waiting">Waiting</span>;
      case "Resolved":
        return <span className="badge-status-resolved">Resolved</span>;
      case "Closed":
        return <span className="badge-status-closed">Closed</span>;
      default:
        return <span className="badge bg-secondary text-white">{status}</span>;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="container-fluid px-0">
      {/* Header Banner */}
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 pb-2 border-bottom">
        <div>
          <h1 className="h3 fw-bold mb-1" style={{ color: "var(--color-primary-green)" }}>
            Welcome, {displayName}!
          </h1>
          <p className="text-muted mb-0">Here's the latest on your service requests.</p>
        </div>
        <div className="d-flex gap-2 mt-2 mt-sm-0">
          <button
            type="button"
            className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
            onClick={loadDashboard}
            disabled={isLoading}
            title="Refresh dashboard metrics"
          >
            <span>🔄</span> Refresh
          </button>
        </div>
      </div>

      {/* Error Feedback */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between mb-4" data-testid="dashboard-error">
          <div>
            <strong>Failed to load dashboard data:</strong> {error}
          </div>
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={loadDashboard}>
            Retry
          </button>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && !data && (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading dashboard...</span>
          </div>
        </div>
      )}

      {data && (
        <>
          {/* KPI Metric Cards Row (AC-12, UI-spec 3.2) */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-lg-3">
              <div
                className="zen-card p-3 h-100 shadow-sm border text-center cursor-pointer hover-card"
                data-testid="kpi-my-open"
                onClick={() => onViewAllTickets("open")}
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer", transition: "transform 0.15s ease-in-out" }}
              >
                <div className="small text-muted text-uppercase fw-semibold mb-1">My Open Tickets</div>
                <div className="display-5 fw-bold" style={{ color: "var(--color-primary-green)" }}>
                  {data.metrics.myOpenTickets}
                </div>
                <div className="small text-muted mt-1">View open requests →</div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <div
                className="zen-card p-3 h-100 shadow-sm border text-center cursor-pointer hover-card"
                data-testid="kpi-in-progress"
                onClick={() => onViewAllTickets("In Progress")}
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer", transition: "transform 0.15s ease-in-out" }}
              >
                <div className="small text-muted text-uppercase fw-semibold mb-1">In Progress</div>
                <div className="display-5 fw-bold text-primary">
                  {data.metrics.inProgressTickets}
                </div>
                <div className="small text-muted mt-1">Under technical work →</div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <div
                className="zen-card p-3 h-100 shadow-sm border text-center cursor-pointer hover-card"
                data-testid="kpi-waiting-input"
                onClick={() => onViewAllTickets("Waiting for Requester")}
                role="button"
                tabIndex={0}
                style={{
                  cursor: "pointer",
                  transition: "transform 0.15s ease-in-out",
                  backgroundColor: data.metrics.waitingForRequesterTickets > 0 ? "#FEF3C7" : undefined,
                  borderColor: data.metrics.waitingForRequesterTickets > 0 ? "#F59E0B" : undefined,
                }}
              >
                <div className="small text-muted text-uppercase fw-semibold mb-1">Waiting for Your Input</div>
                <div className="display-5 fw-bold text-warning">
                  {data.metrics.waitingForRequesterTickets}
                </div>
                <div className="small text-muted mt-1">Requires your reply →</div>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-lg-3">
              <div
                className="zen-card p-3 h-100 shadow-sm border text-center cursor-pointer hover-card"
                data-testid="kpi-recently-resolved"
                onClick={() => onViewAllTickets("Resolved")}
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer", transition: "transform 0.15s ease-in-out" }}
              >
                <div className="small text-muted text-uppercase fw-semibold mb-1">Recently Resolved</div>
                <div className="display-5 fw-bold text-secondary">
                  {data.metrics.recentlyResolvedTickets}
                </div>
                <div className="small text-muted mt-1">Past 30 days →</div>
              </div>
            </div>
          </div>

          {/* Main Body: Recent Tickets & Quick Actions */}
          <div className="row g-4">
            {/* Recent Tickets Column */}
            <div className="col-12 col-lg-8">
              <div className="zen-card p-4 h-100">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                  <h2 className="h5 fw-bold mb-0" style={{ color: "var(--color-primary-green)" }}>
                    📋 Recent Service Requests
                  </h2>
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-decoration-none text-success fw-semibold"
                    onClick={() => onViewAllTickets()}
                  >
                    View All →
                  </button>
                </div>

                {data.recentTickets.length === 0 ? (
                  <div className="text-center py-5" data-testid="empty-dashboard-state">
                    <div className="fs-1 mb-2">🌿</div>
                    <h3 className="h6 fw-bold text-dark">You have not submitted any service tickets yet.</h3>
                    <p className="text-muted small mb-3">
                      When you submit a service request, its status and updates will appear right here.
                    </p>
                    <button
                      type="button"
                      className="btn btn-zen-primary btn-sm"
                      data-testid="empty-create-ticket-btn"
                      onClick={onCreateTicket}
                    >
                      ➕ Create Your First Ticket
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr className="small text-muted text-uppercase">
                          <th scope="col" style={{ width: "160px" }}>Ticket #</th>
                          <th scope="col">Summary</th>
                          <th scope="col" style={{ width: "130px" }}>Status</th>
                          <th scope="col" style={{ width: "120px" }}>Created</th>
                          <th scope="col" style={{ width: "80px" }} className="text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentTickets.map((t) => (
                          <tr
                            key={t.id}
                            data-testid={`recent-ticket-${t.id}`}
                            className="cursor-pointer"
                            onClick={() => onSelectTicket(t.id)}
                            style={{ cursor: "pointer" }}
                          >
                            <td className="fw-semibold text-primary">{t.ticketNumber}</td>
                            <td>
                              <div className="fw-medium text-dark text-truncate" style={{ maxWidth: "260px" }}>
                                {t.summary}
                              </div>
                            </td>
                            <td>{renderStatusBadge(t.status)}</td>
                            <td className="small text-muted">{formatDate(t.createdAt)}</td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success py-0 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectTicket(t.id);
                                }}
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
              </div>
            </div>

            {/* Quick Actions & Tips Column */}
            <div className="col-12 col-lg-4">
              <div className="zen-card p-4 mb-4">
                <h2 className="h5 fw-bold mb-3 pb-2 border-bottom" style={{ color: "var(--color-primary-green)" }}>
                  ⚡ Quick Actions
                </h2>
                <div className="d-grid gap-2">
                  <button
                    type="button"
                    className="btn btn-zen-primary d-flex align-items-center justify-content-center gap-2"
                    onClick={onCreateTicket}
                  >
                    <span>➕</span> Create New Ticket
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2"
                    onClick={() => onViewAllTickets()}
                  >
                    <span>📋</span> View All My Tickets
                  </button>
                </div>
              </div>

              {/* Service Desk Notice / Zen Help Tip */}
              <div className="p-3 bg-light rounded border">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="fs-5">💡</span>
                  <h3 className="h6 fw-bold mb-0 text-success">Service Desk Tip</h3>
                </div>
                <p className="small text-muted mb-0">
                  Tickets marked <strong>Waiting for Requester</strong> require your review or clarification. Click on the ticket to provide the requested information and help us resolve your issue promptly.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
