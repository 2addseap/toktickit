import React, { useState, useEffect, useCallback } from "react";
import {
  getTicketDetail,
  getStaffAssignees,
  assignTicket,
  updateTicketPriority,
  updateTicketStatus,
  getPublicComments,
  postPublicComment,
  getInternalNotes,
  postInternalNote,
  downloadAttachment,
  Ticket,
  TicketComment,
  StaffAssignee,
  Attachment,
} from "../api.js";
import { useAuth } from "../context/AuthContext.js";

interface StaffTicketDetailProps {
  ticketId: number;
  onBack: () => void;
}

// Permitted status transitions matrix (BR-16)
const STATUS_TRANSITIONS: Record<string, string[]> = {
  New: ["Open", "In Progress", "Cancelled"],
  Open: ["In Progress", "Waiting for Requester", "Resolved", "Cancelled"],
  "In Progress": ["Waiting for Requester", "Resolved", "Cancelled"],
  "Waiting for Requester": ["In Progress", "Resolved", "Cancelled"],
  Resolved: ["Closed", "Reopened"],
  Closed: ["Reopened"],
  Reopened: ["In Progress", "Waiting for Requester", "Resolved", "Cancelled"],
  Cancelled: [],
};

export default function StaffTicketDetail({ ticketId, onBack }: StaffTicketDetailProps) {
  const { currentUser } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [assignees, setAssignees] = useState<StaffAssignee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Operational controls state
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [selectedPriority, setSelectedPriority] = useState<string>("MEDIUM");
  const [priorityUpdating, setPriorityUpdating] = useState<boolean>(false);
  const [priorityFeedback, setPriorityFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>("");
  const [assignUpdating, setAssignUpdating] = useState<boolean>(false);
  const [assignFeedback, setAssignFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Collaboration Tabs
  const [activeTab, setActiveTab] = useState<"public-comments" | "internal-notes">("public-comments");
  const [publicComments, setPublicComments] = useState<TicketComment[]>([]);
  const [internalNotes, setInternalNotes] = useState<TicketComment[]>([]);
  const [newPublicComment, setNewPublicComment] = useState<string>("");
  const [newInternalNote, setNewInternalNote] = useState<string>("");
  const [commentSubmitting, setCommentSubmitting] = useState<boolean>(false);
  const [noteSubmitting, setNoteSubmitting] = useState<boolean>(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Load ticket details and associated data
  const loadTicketData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ticketData, staffList, pubComments, intNotes] = await Promise.all([
        getTicketDetail(ticketId),
        getStaffAssignees().catch(() => []),
        getPublicComments(ticketId).catch(() => []),
        getInternalNotes(ticketId).catch(() => []),
      ]);

      setTicket(ticketData);
      setAssignees(staffList);
      setPublicComments(pubComments);
      setInternalNotes(intNotes);

      // Initialize control values
      const currentTransitions = STATUS_TRANSITIONS[ticketData.status] || [];
      setSelectedStatus(currentTransitions[0] || ticketData.status);
      setSelectedPriority(ticketData.itPriority || ticketData.requestedPriority || "MEDIUM");
      setSelectedAssigneeId(ticketData.assignedToId ? String(ticketData.assignedToId) : "");
    } catch (err) {
      console.error("Failed to load staff ticket detail:", err);
      setError(err instanceof Error ? err.message : "Failed to load ticket details.");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    loadTicketData();
  }, [loadTicketData]);

  // Handle Status Update
  async function handleUpdateStatus(e: React.FormEvent) {
    e.preventDefault();
    if (!ticket || !selectedStatus || selectedStatus === ticket.status) return;

    setStatusUpdating(true);
    setStatusFeedback(null);
    try {
      const updated = await updateTicketStatus(ticket.id, selectedStatus);
      setTicket((prev) => (prev ? { ...prev, status: updated.status } : null));
      const nextTransitions = STATUS_TRANSITIONS[updated.status] || [];
      setSelectedStatus(nextTransitions[0] || updated.status);
      setStatusFeedback({ type: "success", text: `Status successfully updated to "${updated.status}".` });
    } catch (err) {
      setStatusFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update status.",
      });
    } finally {
      setStatusUpdating(false);
    }
  }

  // Handle Priority Update
  async function handleUpdatePriority(e: React.FormEvent) {
    e.preventDefault();
    if (!ticket || !selectedPriority) return;

    setPriorityUpdating(true);
    setPriorityFeedback(null);
    try {
      const updated = await updateTicketPriority(ticket.id, selectedPriority);
      setTicket((prev) => (prev ? { ...prev, itPriority: updated.itPriority } : null));
      setPriorityFeedback({ type: "success", text: `IT Priority updated to "${updated.itPriority}".` });
    } catch (err) {
      setPriorityFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update IT priority.",
      });
    } finally {
      setPriorityUpdating(false);
    }
  }

  // Handle Reassignment
  async function handleReassign(targetId: number | null) {
    if (!ticket) return;

    setAssignUpdating(true);
    setAssignFeedback(null);
    try {
      const updated = await assignTicket(ticket.id, targetId);
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              assignedToId: updated.assignedToId,
              assignedTo: updated.assignedTo,
            }
          : null
      );
      setSelectedAssigneeId(updated.assignedToId ? String(updated.assignedToId) : "");
      setAssignFeedback({
        type: "success",
        text: targetId
          ? `Ticket assigned to ${updated.assignedTo?.name || "Staff member"}.`
          : "Ticket unassigned.",
      });
    } catch (err) {
      setAssignFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update assignment.",
      });
    } finally {
      setAssignUpdating(false);
    }
  }

  // Handle Quick Claim
  function handleClaimForMyself() {
    if (!currentUser) return;
    handleReassign(currentUser.id);
  }

  // Handle Public Comment Submission
  async function handlePostPublicComment(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newPublicComment.trim();
    if (!trimmed || !ticket) return;

    setCommentSubmitting(true);
    setCommentError(null);
    try {
      const comment = await postPublicComment(ticket.id, trimmed);
      setPublicComments((prev) => [...prev, comment]);
      setNewPublicComment("");
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "Failed to post comment.");
    } finally {
      setCommentSubmitting(false);
    }
  }

  // Handle Internal Note Submission
  async function handlePostInternalNote(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newInternalNote.trim();
    if (!trimmed || !ticket) return;

    setNoteSubmitting(true);
    setNoteError(null);
    try {
      const note = await postInternalNote(ticket.id, trimmed);
      setInternalNotes((prev) => [...prev, note]);
      setNewInternalNote("");
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : "Failed to post internal note.");
    } finally {
      setNoteSubmitting(false);
    }
  }

  // Handle Attachment Download
  async function handleDownloadAttachment(att: Attachment) {
    try {
      await downloadAttachment(att.id, undefined, att.fileName);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to download attachment.");
    }
  }

  // Priority Badge Helper
  function renderPriorityBadge(p?: string | null) {
    const upper = (p || "MEDIUM").toUpperCase();
    let badgeClass = "badge-priority-medium";
    if (upper === "LOW") badgeClass = "badge-priority-low";
    if (upper === "HIGH") badgeClass = "badge-priority-high";
    if (upper === "URGENT") badgeClass = "badge-priority-urgent";

    return <span className={badgeClass}>{upper}</span>;
  }

  // Status Badge Helper
  function renderStatusBadge(s?: string) {
    const norm = (s || "New").toLowerCase();
    let badgeClass = "badge-status-new";
    if (norm === "open") badgeClass = "badge-status-open";
    if (norm === "in progress") badgeClass = "badge-status-inprogress";
    if (norm === "waiting for requester") badgeClass = "badge-status-inprogress";
    if (norm === "resolved") badgeClass = "badge-status-resolved";
    if (norm === "closed") badgeClass = "badge-status-closed";
    if (norm === "cancelled") badgeClass = "badge bg-secondary text-white";
    if (norm === "reopened") badgeClass = "badge-status-open";

    return <span className={badgeClass}>{s || "New"}</span>;
  }

  // Format Date Helper
  function formatDate(dateStr?: string | null) {
    if (!dateStr) return "-";
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

  // Format File Size Helper
  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  if (loading) {
    return (
      <div className="zen-card p-5 text-center my-4" data-testid="staff-ticket-loading">
        <div className="spinner-border text-success mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading ticket details...</span>
        </div>
        <p className="text-muted mb-0">Loading ticket operational details...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="zen-card p-5 text-center my-4" data-testid="staff-ticket-error">
        <div className="fs-1 text-danger mb-3">⚠️</div>
        <h2 className="h4 fw-bold text-danger mb-2">Unable to Load Ticket</h2>
        <p className="text-muted mx-auto mb-4" style={{ maxWidth: 450 }}>
          {error || "Ticket not found or you do not have permission to view it."}
        </p>
        <button
          type="button"
          className="btn btn-zen-secondary px-4 py-2"
          onClick={onBack}
          data-testid="back-to-queue-btn"
        >
          ← Back to Ticket Queue
        </button>
      </div>
    );
  }

  const allowedTransitions = STATUS_TRANSITIONS[ticket.status] || [];
  const isTerminal = allowedTransitions.length === 0;
  const isAssignedToCurrentUser = currentUser && ticket.assignedToId === currentUser.id;

  return (
    <div className="staff-ticket-detail pb-5" data-testid="staff-ticket-detail-view">
      {/* Breadcrumb Navigation */}
      <div className="d-flex align-items-center gap-2 mb-4">
        <button
          type="button"
          className="btn btn-sm btn-zen-secondary d-inline-flex align-items-center gap-1"
          onClick={onBack}
          data-testid="back-to-queue-btn"
        >
          <span>←</span>
          <span>Back to Ticket Queue</span>
        </button>
        <span className="text-muted">/</span>
        <span className="text-muted small fw-semibold" data-testid="detail-ticket-number">
          {ticket.ticketNumber}
        </span>
      </div>

      {/* Requester Resolution Callout Banner (AC-07, UI-spec 3.4) */}
      {ticket.resolvedIndicated && (
        <div
          className="alert alert-success d-flex align-items-start gap-3 p-3 mb-4 rounded-3 shadow-sm border border-success-subtle"
          role="alert"
          data-testid="requester-resolution-banner"
          style={{ backgroundColor: "var(--color-pale-green)", borderColor: "var(--color-primary-green)" }}
        >
          <div className="fs-3 lh-1">💡</div>
          <div className="flex-grow-1">
            <h5 className="alert-heading fw-bold mb-1" style={{ color: "var(--color-primary-green)" }}>
              Requester Indicated Problem is Resolved
            </h5>
            <p className="mb-1">
              The requester signaled that this issue appears resolved. Please verify with the requester and transition ticket status to <strong>Resolved</strong> or <strong>Closed</strong>.
            </p>
            {ticket.resolvedIndicatedAt && (
              <small className="text-muted">
                Indicated on {formatDate(ticket.resolvedIndicatedAt)}
              </small>
            )}
          </div>
        </div>
      )}

      {/* Operational Controls Panel (Screen 3 Top Card) */}
      <div className="zen-card p-4 mb-4" data-testid="operational-controls-card">
        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
          <h2 className="h5 fw-bold mb-0" style={{ color: "var(--color-primary-green)" }}>
            ⚙️ Operational Controls
          </h2>
          <span className="badge rounded-pill bg-light text-dark border">
            IT Staff Actions
          </span>
        </div>

        <div className="row g-4">
          {/* Status Lifecycle Transition Control (AC-15, BR-16) */}
          <div className="col-12 col-md-4">
            <div className="p-3 bg-light rounded border h-100 d-flex flex-column justify-content-between">
              <div>
                <label htmlFor="status-transition-select" className="form-label fw-bold small text-muted text-uppercase mb-1">
                  Ticket Status
                </label>
                <div className="mb-2">
                  <span className="small text-muted me-2">Current:</span>
                  <span data-testid="current-status-badge">{renderStatusBadge(ticket.status)}</span>
                </div>

                {isTerminal ? (
                  <p className="small text-muted mb-0 fst-italic">
                    Terminal status — no further status transitions permitted.
                  </p>
                ) : (
                  <form onSubmit={handleUpdateStatus}>
                    <div className="mb-2">
                      <select
                        id="status-transition-select"
                        data-testid="status-transition-select"
                        className="form-select form-select-sm"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        disabled={statusUpdating}
                      >
                        {allowedTransitions.map((next) => (
                          <option key={next} value={next}>
                            Transition to: {next}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      data-testid="update-status-btn"
                      className="btn btn-sm btn-zen-primary w-100"
                      disabled={statusUpdating || !selectedStatus || selectedStatus === ticket.status}
                    >
                      {statusUpdating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Updating...
                        </>
                      ) : (
                        "Update Status"
                      )}
                    </button>
                  </form>
                )}
              </div>

              {statusFeedback && (
                <div
                  className={`alert ${statusFeedback.type === "success" ? "alert-success" : "alert-danger"} p-2 small mt-2 mb-0`}
                  role="alert"
                  data-testid="status-feedback"
                >
                  {statusFeedback.text}
                </div>
              )}
            </div>
          </div>

          {/* Operational IT Priority Control (AC-14, BR-13) */}
          <div className="col-12 col-md-4">
            <div className="p-3 bg-light rounded border h-100 d-flex flex-column justify-content-between">
              <div>
                <label htmlFor="it-priority-select" className="form-label fw-bold small text-muted text-uppercase mb-1">
                  Operational IT Priority
                </label>
                <div className="mb-2">
                  <span className="small text-muted me-2">Current:</span>
                  <span data-testid="current-it-priority-badge">{renderPriorityBadge(ticket.itPriority || ticket.requestedPriority)}</span>
                  <span className="small text-muted ms-2 fst-italic">
                    (Req: {ticket.requestedPriority})
                  </span>
                </div>

                <form onSubmit={handleUpdatePriority}>
                  <div className="mb-2">
                    <select
                      id="it-priority-select"
                      data-testid="it-priority-select"
                      className="form-select form-select-sm"
                      value={selectedPriority}
                      onChange={(e) => setSelectedPriority(e.target.value)}
                      disabled={priorityUpdating}
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="URGENT">URGENT</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    data-testid="update-priority-btn"
                    className="btn btn-sm btn-zen-primary w-100"
                    disabled={priorityUpdating || selectedPriority === ticket.itPriority}
                  >
                    {priorityUpdating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Updating...
                      </>
                    ) : (
                      "Update Priority"
                    )}
                  </button>
                </form>
              </div>

              {priorityFeedback && (
                <div
                  className={`alert ${priorityFeedback.type === "success" ? "alert-success" : "alert-danger"} p-2 small mt-2 mb-0`}
                  role="alert"
                  data-testid="priority-feedback"
                >
                  {priorityFeedback.text}
                </div>
              )}
            </div>
          </div>

          {/* Owner Assignment Control (AC-13, BR-12) */}
          <div className="col-12 col-md-4">
            <div className="p-3 bg-light rounded border h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label htmlFor="assignee-select" className="form-label fw-bold small text-muted text-uppercase mb-0">
                    Assigned IT Staff
                  </label>
                  {currentUser && !isAssignedToCurrentUser && (
                    <button
                      type="button"
                      data-testid="claim-btn"
                      className="btn btn-link p-0 text-success fw-bold small text-decoration-none"
                      onClick={handleClaimForMyself}
                      disabled={assignUpdating}
                    >
                      Claim for Myself
                    </button>
                  )}
                </div>

                <div className="mb-2">
                  <span className="small text-muted me-2">Owner:</span>
                  <span className="fw-semibold" data-testid="current-assignee-name">
                    {ticket.assignedTo ? ticket.assignedTo.name : "Unassigned"}
                  </span>
                </div>

                <div className="mb-2">
                  <select
                    id="assignee-select"
                    data-testid="assignee-select"
                    className="form-select form-select-sm"
                    value={selectedAssigneeId}
                    onChange={(e) => setSelectedAssigneeId(e.target.value)}
                    disabled={assignUpdating}
                  >
                    <option value="">-- Unassigned --</option>
                    {assignees.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} ({staff.role === "ADMINISTRATOR" ? "Admin" : "Staff"})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  data-testid="reassign-btn"
                  className="btn btn-sm btn-zen-secondary w-100"
                  onClick={() => handleReassign(selectedAssigneeId ? Number(selectedAssigneeId) : null)}
                  disabled={
                    assignUpdating ||
                    (selectedAssigneeId === "" && !ticket.assignedToId) ||
                    (selectedAssigneeId !== "" && Number(selectedAssigneeId) === ticket.assignedToId)
                  }
                >
                  {assignUpdating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Reassigning...
                    </>
                  ) : (
                    "Reassign"
                  )}
                </button>
              </div>

              {assignFeedback && (
                <div
                  className={`alert ${assignFeedback.type === "success" ? "alert-success" : "alert-danger"} p-2 small mt-2 mb-0`}
                  role="alert"
                  data-testid="assign-feedback"
                >
                  {assignFeedback.text}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Core Details Card */}
      <div className="zen-card p-4 mb-4" data-testid="core-details-card">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 mb-3 pb-3 border-bottom">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
              <span className="fs-4 fw-bold" style={{ color: "var(--color-primary-green)" }}>
                {ticket.ticketNumber}
              </span>
              {renderPriorityBadge(ticket.itPriority || ticket.requestedPriority)}
              {renderStatusBadge(ticket.status)}
            </div>
            <h1 className="h4 fw-bold mb-0" data-testid="ticket-summary">{ticket.summary}</h1>
          </div>
          <div className="text-muted small text-md-end">
            <div><strong>Created:</strong> {formatDate(ticket.createdAt)}</div>
            <div><strong>Updated:</strong> {formatDate(ticket.updatedAt)}</div>
          </div>
        </div>

        {/* Read-Only Metadata Grid */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="p-2 px-3 rounded zen-readonly">
              <div className="text-muted small">Requester</div>
              <div className="fw-semibold text-truncate" data-testid="requester-name">
                {ticket.requester?.name || "Unknown"}
              </div>
              <div className="small text-muted text-truncate">
                {ticket.requester?.email || "-"}
              </div>
              {ticket.requester?.department && (
                <div className="small text-muted fst-italic">
                  Dept: {ticket.requester.department}
                </div>
              )}
            </div>
          </div>

          <div className="col-6 col-md-4">
            <div className="p-2 px-3 rounded zen-readonly">
              <div className="text-muted small">Category</div>
              <div className="fw-semibold" data-testid="ticket-category">{ticket.category?.name || "General"}</div>
            </div>
          </div>

          <div className="col-6 col-md-4">
            <div className="p-2 px-3 rounded zen-readonly">
              <div className="text-muted small">Related System</div>
              <div className="fw-semibold" data-testid="ticket-system">{ticket.relatedSystem?.name || "General IT"}</div>
            </div>
          </div>
        </div>

        {/* Problem Description */}
        <h3 className="h6 fw-bold text-muted text-uppercase mb-2">Problem Description</h3>
        <div
          className="p-3 bg-light rounded border text-break mb-4"
          style={{ whiteSpace: "pre-wrap", minHeight: 80 }}
          data-testid="ticket-description"
        >
          {ticket.description}
        </div>

        {/* Attachments Section */}
        <div>
          <h3 className="h6 fw-bold text-muted text-uppercase mb-2">
            Attachments ({ticket.attachments ? ticket.attachments.filter((a) => !a.isRemoved).length : 0})
          </h3>

          {!ticket.attachments || ticket.attachments.length === 0 ? (
            <p className="text-muted small fst-italic mb-0">No attachments uploaded for this ticket.</p>
          ) : (
            <div className="row g-2">
              {ticket.attachments.map((att) => {
                const isPdf = att.mimeType.toLowerCase().includes("pdf") || att.fileName.toLowerCase().endsWith(".pdf");
                return (
                  <div key={att.id} className="col-12 col-md-6">
                    <div className={`p-2 px-3 rounded border d-flex align-items-center justify-content-between ${att.isRemoved ? "bg-light opacity-75" : "bg-white"}`}>
                      <div className="d-flex align-items-center gap-2 overflow-hidden">
                        <span>{isPdf ? "📄" : "🖼️"}</span>
                        <div className="overflow-hidden">
                          <div className={`small fw-semibold text-truncate ${att.isRemoved ? "text-decoration-line-through text-muted" : ""}`}>
                            {att.fileName}
                          </div>
                          <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                            {formatFileSize(att.fileSize)} {att.isRemoved && "• (Removed)"}
                          </div>
                        </div>
                      </div>

                      {!att.isRemoved ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1"
                          onClick={() => handleDownloadAttachment(att)}
                          data-testid={`download-attachment-${att.id}`}
                        >
                          <span>⬇️</span>
                          <span className="small">Download</span>
                        </button>
                      ) : (
                        <span className="badge bg-secondary text-white small">Removed</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Communication & Collaboration Tabs (AC-08, AC-09, AC-10, BR-17, BR-18, UI-05) */}
      <div className="zen-card p-4" data-testid="collaboration-section">
        {/* Nav Tabs */}
        <ul className="nav nav-pills gap-2 mb-4 border-bottom pb-3">
          <li className="nav-item">
            <button
              type="button"
              className={`btn btn-sm ${
                activeTab === "public-comments"
                  ? "btn-zen-primary active"
                  : "btn-outline-secondary"
              }`}
              onClick={() => setActiveTab("public-comments")}
              data-testid="public-comments-tab"
            >
              💬 Public Comments ({publicComments.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`btn btn-sm ${
                activeTab === "internal-notes"
                  ? "btn-warning fw-bold"
                  : "btn-outline-warning text-dark"
              }`}
              onClick={() => setActiveTab("internal-notes")}
              data-testid="internal-notes-tab"
              style={
                activeTab === "internal-notes"
                  ? { backgroundColor: "#F0C050", borderColor: "#D4A017", color: "#1C2826" }
                  : {}
              }
            >
              🔒 Internal Notes ({internalNotes.length})
            </button>
          </li>
        </ul>

        {/* Tab 1: Public Comments Timeline (AC-08, BR-17) */}
        {activeTab === "public-comments" && (
          <div data-testid="public-comments-panel">
            <p className="small text-muted mb-3">
              Public comments are visible to the ticket requester and all IT staff. Use this channel to ask questions or provide status updates to the user.
            </p>

            {/* Existing Comments List */}
            <div className="d-flex flex-column gap-3 mb-4" data-testid="public-comments-list">
              {publicComments.length === 0 ? (
                <div className="p-3 text-center text-muted bg-light rounded border">
                  No public comments posted yet.
                </div>
              ) : (
                publicComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3 comment-item-public"
                    data-testid={`public-comment-${comment.id}`}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <strong className="small">{comment.author.name}</strong>
                        <span className="badge-role-user">
                          {comment.author.role}
                        </span>
                      </div>
                      <span className="text-muted small">{formatDate(comment.createdAt)}</span>
                    </div>
                    <div className="small text-break" style={{ whiteSpace: "pre-wrap" }}>
                      {comment.body}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Public Comment Form */}
            <form onSubmit={handlePostPublicComment}>
              <div className="mb-2">
                <label htmlFor="public-comment-input" className="form-label fw-semibold small">
                  Post Public Comment
                </label>
                <textarea
                  id="public-comment-input"
                  data-testid="public-comment-input"
                  className="form-control"
                  rows={3}
                  placeholder="Type a message visible to the requester..."
                  value={newPublicComment}
                  onChange={(e) => setNewPublicComment(e.target.value)}
                  disabled={commentSubmitting}
                />
              </div>

              {commentError && (
                <div className="alert alert-danger p-2 small mb-2" role="alert">
                  {commentError}
                </div>
              )}

              <button
                type="submit"
                data-testid="post-public-comment-btn"
                className="btn btn-zen-primary btn-sm px-3"
                disabled={commentSubmitting || !newPublicComment.trim()}
              >
                {commentSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Posting...
                  </>
                ) : (
                  "Post Public Comment"
                )}
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Internal Notes Timeline (AC-09, AC-10, BR-18, UI-05) */}
        {activeTab === "internal-notes" && (
          <div className="card-internal-note p-3 p-md-4" data-testid="internal-notes-panel">
            {/* Prominent Warning Header (BR-18, UI-05) */}
            <div
              className="alert alert-warning d-flex align-items-center gap-2 p-2 px-3 mb-3 border border-warning"
              role="alert"
              data-testid="internal-note-warning"
              style={{ backgroundColor: "#FEF3C7", borderColor: "#F59E0B" }}
            >
              <span className="fs-5">🔒</span>
              <div className="small fw-bold" style={{ color: "#92400E" }}>
                Internal Note — Visible only to IT Staff and Administrators. Never shared with the requester.
              </div>
            </div>

            {/* Existing Notes List */}
            <div className="d-flex flex-column gap-3 mb-4" data-testid="internal-notes-list">
              {internalNotes.length === 0 ? (
                <div className="p-3 text-center text-muted bg-white rounded border">
                  No internal operational notes recorded yet.
                </div>
              ) : (
                internalNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 item-internal-note"
                    data-testid={`internal-note-${note.id}`}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <strong className="small">{note.author.name}</strong>
                        <span className="badge bg-warning text-dark border small" style={{ fontSize: "0.75rem" }}>
                          🔒 {note.author.role}
                        </span>
                      </div>
                      <span className="text-muted small">{formatDate(note.createdAt)}</span>
                    </div>
                    <div className="small text-break" style={{ whiteSpace: "pre-wrap" }}>
                      {note.body}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Internal Note Form */}
            <form onSubmit={handlePostInternalNote}>
              <div className="mb-2">
                <label htmlFor="internal-note-input" className="form-label fw-bold small text-dark">
                  Record Internal Note (Confidential)
                </label>
                <textarea
                  id="internal-note-input"
                  data-testid="internal-note-input"
                  className="form-control"
                  rows={3}
                  placeholder="Record operational details, diagnostics, escalations, or sensitive notes..."
                  value={newInternalNote}
                  onChange={(e) => setNewInternalNote(e.target.value)}
                  disabled={noteSubmitting}
                  style={{ backgroundColor: "#FFFFFF" }}
                />
              </div>

              {noteError && (
                <div className="alert alert-danger p-2 small mb-2" role="alert">
                  {noteError}
                </div>
              )}

              <button
                type="submit"
                data-testid="post-internal-note-btn"
                className="btn btn-warning btn-sm px-3 fw-bold text-dark border"
                style={{ backgroundColor: "#F0C050", borderColor: "#D4A017" }}
                disabled={noteSubmitting || !newInternalNote.trim()}
              >
                {noteSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Saving Note...
                  </>
                ) : (
                  "Add Internal Note"
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
