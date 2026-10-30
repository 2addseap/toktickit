import { useState, useEffect, useCallback } from "react";
import { getStaffDashboard, StaffDashboardData } from "../api.js";
import { useAuth } from "../context/AuthContext.js";

interface StaffDashboardProps {
  onSelectTicket: (ticketId: number) => void;
  onNavigateToQueue: (filter?: { status?: string; assignedTo?: string; itPriority?: string }) => void;
  onCreateTicket?: () => void;
  onNavigateToUserManagement?: () => void;
}

export default function StaffDashboard({
  onSelectTicket,
  onNavigateToQueue,
  onCreateTicket,
  onNavigateToUserManagement,
}: StaffDashboardProps) {
  const { currentUser } = useAuth();
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const displayName = currentUser?.name || "IT Staff";

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getStaffDashboard();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load operational dashboard.");
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
      case "Reopened":
        return <span className="badge bg-warning text-dark">Reopened</span>;
      case "Cancelled":
        return <span className="badge bg-secondary text-white">Cancelled</span>;
      default:
        return <span className="badge bg-secondary text-white">{status}</span>;
    }
  };

  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return <span className="badge-priority-urgent">URGENT</span>;
      case "HIGH":
        return <span className="badge-priority-high">HIGH</span>;
      case "MEDIUM":
        return <span className="badge-priority-medium">MEDIUM</span>;
      case "LOW":
        return <span className="badge-priority-low">LOW</span>;
      default:
        return <span className="badge bg-secondary text-white">{priority}</span>;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
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
            Welcome back, {displayName}!
          </h1>
          <p className="text-muted mb-0">Here's what's happening with your queue today.</p>
        </div>
        <div className="d-flex gap-2 mt-2 mt-sm-0">
          <button
            type="button"
            className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
            onClick={loadDashboard}
            disabled={isLoading}
            title="Refresh operational metrics"
          >
            <span>🔄</span> Refresh
          </button>
        </div>
      </div>

      {/* Error Feedback */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between mb-4" data-testid="staff-dashboard-error">
          <div>
            <strong>Operational Error:</strong> {error}
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
          {/* Top Operational Metrics Row (Handout 8.1 / AC-14) */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3 col-xl">
              <div
                className="zen-card p-3 h-100 shadow-sm border text-center cursor-pointer hover-card"
                data-testid="kpi-new"
                onClick={() => onNavigateToQueue({ status: "New" })}
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer", transition: "transform 0.15s ease-in-out" }}
              >
                <div className="small text-muted text-uppercase fw-semibold mb-1">New</div>
                <div className="display-6 fw-bold text-dark">{data.metrics.newTickets}</div>
                <div className="small text-muted mt-1">Unassigned triage →</div>
              </div>
            </div>

            <div className="col-6 col-md-3 col-xl">
              <div
                className="zen-card p-3 h-100 shadow-sm border text-center cursor-pointer hover-card"
                data-testid="kpi-open"
                onClick={() => onNavigateToQueue({ status: "Open" })}
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer", transition: "transform 0.15s ease-in-out" }}
              >
                <div className="small text-muted text-uppercase fw-semibold mb-1">Open</div>
                <div className="display-6 fw-bold" style={{ color: "var(--color-primary-green)" }}>
                  {data.metrics.openTickets}
                </div>
                <div className="small text-muted mt-1">Ready for work →</div>
              </div>
            </div>

            <div className="col-6 col-md-3 col-xl">
              <div
                className="zen-card p-3 h-100 shadow-sm border text-center cursor-pointer hover-card"
                data-testid="kpi-in-progress"
                onClick={() => onNavigateToQueue({ status: "In Progress" })}
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer", transition: "transform 0.15s ease-in-out" }}
              >
                <div className="small text-muted text-uppercase fw-semibold mb-1">In Progress</div>
                <div className="display-6 fw-bold text-primary">{data.metrics.inProgressTickets}</div>
                <div className="small text-muted mt-1">Active investigation →</div>
              </div>
            </div>

            <div className="col-6 col-md-3 col-xl">
              <div
                className="zen-card p-3 h-100 shadow-sm border text-center cursor-pointer hover-card"
                data-testid="kpi-waiting"
                onClick={() => onNavigateToQueue({ status: "Waiting for Requester" })}
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer", transition: "transform 0.15s ease-in-out" }}
              >
                <div className="small text-muted text-uppercase fw-semibold mb-1">Waiting Input</div>
                <div className="display-6 fw-bold text-warning">{data.metrics.waitingRequesterTickets}</div>
                <div className="small text-muted mt-1">Awaiting client →</div>
              </div>
            </div>

            <div className="col-6 col-md-3 col-xl">
              <div
                className="zen-card p-3 h-100 shadow-sm border text-center cursor-pointer hover-card"
                data-testid="kpi-my-assigned"
                onClick={() => onNavigateToQueue({ assignedTo: "me" })}
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer", transition: "transform 0.15s ease-in-out" }}
              >
                <div className="small text-muted text-uppercase fw-semibold mb-1">My Assigned</div>
                <div className="display-6 fw-bold text-info">{data.metrics.myAssignedTickets}</div>
                <div className="small text-muted mt-1">My tickets →</div>
              </div>
            </div>

            <div className="col-6 col-md-3 col-xl">
              <div
                className="zen-card p-3 h-100 shadow-sm border text-center cursor-pointer hover-card"
                data-testid="kpi-unassigned"
                onClick={() => onNavigateToQueue({ assignedTo: "unassigned" })}
                role="button"
                tabIndex={0}
                style={{ cursor: "pointer", transition: "transform 0.15s ease-in-out" }}
              >
                <div className="small text-muted text-uppercase fw-semibold mb-1">Unassigned</div>
                <div className="display-6 fw-bold text-secondary">{data.metrics.unassignedTickets}</div>
                <div className="small text-muted mt-1">Needs claim →</div>
              </div>
            </div>

            <div className="col-6 col-md-3 col-xl">
              <div
                className="zen-card p-3 h-100 shadow-sm border text-center cursor-pointer hover-card"
                data-testid="kpi-urgent"
                onClick={() => onNavigateToQueue({ itPriority: "URGENT" })}
                role="button"
                tabIndex={0}
                style={{
                  cursor: "pointer",
                  transition: "transform 0.15s ease-in-out",
                  backgroundColor: data.metrics.urgentTickets > 0 ? "#FEE2E2" : undefined,
                  borderColor: data.metrics.urgentTickets > 0 ? "#EF4444" : undefined,
                }}
              >
                <div className="small text-muted text-uppercase fw-semibold mb-1">Urgent Priority</div>
                <div className="display-6 fw-bold text-danger">{data.metrics.urgentTickets}</div>
                <div className="small text-muted mt-1">Immediate action →</div>
              </div>
            </div>
          </div>

          {/* Administrator Directory KPI Row (AC-16, FR-13) */}
          {data.metrics.adminUserStats && (
            <div className="mb-4" data-testid="admin-user-stats-card">
              <div className="zen-card p-3 bg-light border">
                <div className="d-flex flex-wrap align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <span className="fs-3">👥</span>
                    <div>
                      <div className="fw-bold text-dark">User Directory Overview (Admin)</div>
                      <div className="small text-muted">
                        Total Users: <strong className="text-dark">{data.metrics.adminUserStats.totalUsers}</strong> (
                        <span className="text-success fw-semibold">{data.metrics.adminUserStats.activeUsers} active</span>,{" "}
                        <span className="text-danger fw-semibold">{data.metrics.adminUserStats.inactiveUsers} inactive</span>)
                      </div>
                    </div>
                  </div>
                  {onNavigateToUserManagement && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-dark mt-2 mt-sm-0"
                      onClick={onNavigateToUserManagement}
                    >
                      Manage User Accounts →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main Operational Section: Urgent / Recent Tickets + Quick Actions */}
          <div className="row g-4">
            <div className="col-12 col-lg-8">
              <div className="zen-card p-4 h-100">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
                  <h2 className="h5 fw-bold mb-0" style={{ color: "var(--color-primary-green)" }}>
                    🔥 Urgent & Active Operational Tickets
                  </h2>
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-decoration-none text-success fw-semibold"
                    onClick={() => onNavigateToQueue()}
                  >
                    View Full Queue →
                  </button>
                </div>

                {data.recentUrgentTickets.length === 0 ? (
                  <div className="text-center py-5" data-testid="empty-urgent-state">
                    <div className="fs-1 mb-2">🌿</div>
                    <h3 className="h6 fw-bold text-dark">No urgent tickets requiring attention.</h3>
                    <p className="text-muted small mb-0">All priority queues are running smoothly.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr className="small text-muted text-uppercase">
                          <th scope="col" style={{ width: "150px" }}>Ticket #</th>
                          <th scope="col">Summary</th>
                          <th scope="col" style={{ width: "120px" }}>Status</th>
                          <th scope="col" style={{ width: "100px" }}>Priority</th>
                          <th scope="col" style={{ width: "140px" }}>Assignee</th>
                          <th scope="col" style={{ width: "120px" }}>Updated</th>
                          <th scope="col" style={{ width: "70px" }} className="text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentUrgentTickets.map((t) => (
                          <tr
                            key={t.id}
                            className="cursor-pointer"
                            onClick={() => onSelectTicket(t.id)}
                            style={{ cursor: "pointer" }}
                          >
                            <td className="fw-semibold text-primary">{t.ticketNumber}</td>
                            <td>
                              <div className="fw-medium text-dark text-truncate" style={{ maxWidth: "220px" }}>
                                {t.summary}
                              </div>
                              {t.requester && (
                                <div className="small text-muted text-truncate" style={{ maxWidth: "220px" }}>
                                  Req: {t.requester.name}
                                </div>
                              )}
                            </td>
                            <td>{renderStatusBadge(t.status)}</td>
                            <td>{renderPriorityBadge(t.itPriority)}</td>
                            <td className="small">
                              {t.assignedTo ? (
                                <span className="fw-semibold text-dark">{t.assignedTo.name}</span>
                              ) : (
                                <span className="text-danger fst-italic">Unassigned</span>
                              )}
                            </td>
                            <td className="small text-muted">{formatDate(t.updatedAt)}</td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success py-0 px-2"
                                data-testid={`view-urgent-ticket-${t.id}`}
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

            {/* Quick Actions Panel */}
            <div className="col-12 col-lg-4">
              <div className="zen-card p-4 mb-4">
                <h2 className="h5 fw-bold mb-3 pb-2 border-bottom" style={{ color: "var(--color-primary-green)" }}>
                  ⚡ Quick Operational Actions
                </h2>
                <div className="d-grid gap-2">
                  {onCreateTicket && (
                    <button
                      type="button"
                      className="btn btn-zen-primary d-flex align-items-center justify-content-center gap-2"
                      onClick={onCreateTicket}
                    >
                      <span>➕</span> Create New Ticket
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2"
                    onClick={() => onNavigateToQueue()}
                  >
                    <span>🎫</span> Open Full Ticket Queue
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2"
                    onClick={() => onNavigateToQueue({ assignedTo: "unassigned" })}
                  >
                    <span>📥</span> View Unassigned Pool
                  </button>
                  {currentUser?.role === "ADMINISTRATOR" && onNavigateToUserManagement && (
                    <button
                      type="button"
                      className="btn btn-outline-dark d-flex align-items-center justify-content-center gap-2"
                      onClick={onNavigateToUserManagement}
                    >
                      <span>👥</span> User Directory Management
                    </button>
                  )}
                </div>
              </div>

              {/* Triage Protocol Tip */}
              <div className="p-3 bg-light rounded border">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="fs-5">🛡️</span>
                  <h3 className="h6 fw-bold mb-0 text-success">Queue Protocol</h3>
                </div>
                <p className="small text-muted mb-0">
                  Always claim unassigned tickets before taking action. Document every diagnostic attempt and configuration update in <strong>Actions Taken</strong> to preserve full auditability.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
