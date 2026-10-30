import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  getTicketDetail,
  uploadAttachment,
  downloadAttachment,
  softRemoveAttachment,
  indicateTicketResolution,
  getPublicComments,
  postPublicComment,
  getActionsTaken,
  Ticket,
  Attachment,
  TicketComment,
  ActionTaken,
} from "../api.js";
import { useRequester } from "../context/RequesterContext.js";

interface TicketDetailProps {
  ticketId: number;
  onBack: () => void;
}

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function TicketDetail({ ticketId, onBack }: TicketDetailProps) {
  const { currentRequester } = useRequester();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Lab 3: Problem Appears Resolved & Public Comments state
  const [showResolveModal, setShowResolveModal] = useState<boolean>(false);
  const [resolving, setResolving] = useState<boolean>(false);
  const [resolveError, setResolveError] = useState<string>("");
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [commentSubmitting, setCommentSubmitting] = useState<boolean>(false);
  const [commentError, setCommentError] = useState<string>("");

  // Attachment upload state
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Soft-removal modal state
  const [removingAttachment, setRemovingAttachment] = useState<Attachment | null>(null);
  const [removalReason, setRemovalReason] = useState<string>("");
  const [removalError, setRemovalError] = useState<string>("");
  const [confirmingRemoval, setConfirmingRemoval] = useState<boolean>(false);

  // Lab 4 — Actions Taken (read-only for Requesters)
  const [actionsTaken, setActionsTaken] = useState<ActionTaken[]>([]);

  // Load ticket details
  const fetchDetail = useCallback(async () => {
    if (!currentRequester) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getTicketDetail(ticketId, currentRequester.id);
      setTicket(data);
      try {
        const comms = await getPublicComments(ticketId);
        setComments(comms);
      } catch {
        // Safe fallback if comments endpoint is not mocked or available
      }
      try {
        const acts = await getActionsTaken(ticketId);
        setActionsTaken(acts);
      } catch {
        // Safe fallback — actions may not exist yet
      }
    } catch (err) {
      console.error("Failed to load ticket detail:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to retrieve ticket details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [ticketId, currentRequester]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Handle single attachment upload
  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError("");
    if (!e.target.files || e.target.files.length === 0 || !currentRequester) return;

    const file = e.target.files[0];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setUploadError(`"${file.name}" has an invalid format. Only JPG, PNG, WEBP, and PDF files are allowed.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`"${file.name}" exceeds the maximum 5 MB limit.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const newAtt = await uploadAttachment(ticketId, file, currentRequester.id);
      setTicket((prev) => {
        if (!prev) return prev;
        const currentAtts = prev.attachments || [];
        return {
          ...prev,
          attachments: [...currentAtts, newAtt],
        };
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload attachment.");
    } finally {
      setUploading(false);
    }
  }

  // Handle download
  async function handleDownload(attachment: Attachment) {
    if (!currentRequester) return;
    try {
      await downloadAttachment(attachment.id, currentRequester.id, attachment.fileName);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to download attachment.");
    }
  }

  // Handle soft-removal submission
  async function handleConfirmSoftRemove(e: React.FormEvent) {
    e.preventDefault();
    if (!removingAttachment || !currentRequester) return;

    const trimmedReason = removalReason.trim();
    if (!trimmedReason || trimmedReason.length < 3) {
      setRemovalError("Removal reason is required and must be at least 3 characters.");
      return;
    }

    setConfirmingRemoval(true);
    setRemovalError("");

    try {
      const updated = await softRemoveAttachment(
        removingAttachment.id,
        trimmedReason,
        currentRequester.id
      );

      setTicket((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          attachments: (prev.attachments || []).map((a) =>
            a.id === updated.id ? { ...a, ...updated } : a
          ),
        };
      });

      setRemovingAttachment(null);
      setRemovalReason("");
    } catch (err) {
      setRemovalError(err instanceof Error ? err.message : "Failed to remove attachment.");
    } finally {
      setConfirmingRemoval(false);
    }
  }

  // Priority Badge Helper
  function renderPriorityBadge(p?: string) {
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
    if (norm === "resolved") badgeClass = "badge-status-resolved";
    if (norm === "closed") badgeClass = "badge-status-closed";

    return <span className={badgeClass}>{s || "New"}</span>;
  }

  // Format Date
  function formatDate(dateStr?: string) {
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

  // Format File Size
  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  if (loading) {
    return (
      <div className="zen-card p-5 text-center my-4">
        <div className="spinner-border text-success mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted mb-0">Loading ticket details...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="zen-card p-5 text-center my-4">
        <div className="fs-1 text-danger mb-3">⚠️</div>
        <h2 className="h4 fw-bold text-danger mb-2">Unable to Load Ticket</h2>
        <p className="text-muted mx-auto mb-4" style={{ maxWidth: 450 }}>
          {error || "Ticket not found or you do not have permission to view it."}
        </p>
        <button type="button" className="btn btn-zen-secondary px-4 py-2" onClick={onBack}>
          ← Back to My Tickets
        </button>
      </div>
    );
  }

  const activeAttachments = (ticket.attachments || []).filter((a) => !a.isRemoved);
  const activeCount = activeAttachments.length;
  const isQuotaFull = activeCount >= 5;

  return (
    <div className="ticket-detail-container pb-5">
      {/* Breadcrumb / Back Button */}
      <div className="d-flex align-items-center gap-2 mb-4">
        <button
          type="button"
          className="btn btn-sm btn-zen-secondary d-inline-flex align-items-center gap-1"
          onClick={onBack}
        >
          <span>←</span>
          <span>Back to My Tickets</span>
        </button>
        <span className="text-muted">/</span>
        <span className="text-muted small fw-semibold">{ticket.ticketNumber}</span>
      </div>

      {/* Header Summary Card */}
      <div className="zen-card p-4 mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 mb-3 pb-3 border-bottom">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
              <span className="fs-4 fw-bold" style={{ color: "var(--color-primary-green)" }}>
                {ticket.ticketNumber}
              </span>
              {renderPriorityBadge(ticket.requestedPriority)}
              {renderStatusBadge(ticket.status)}
              {ticket.resolvedIndicated ? (
                <span data-testid="resolved-indicated-badge" className="badge bg-success-subtle text-success border border-success-subtle small">
                  ✓ You indicated this issue appears resolved
                </span>
              ) : ["Open", "In Progress", "Waiting for Requester"].includes(ticket.status) ? (
                <button
                  type="button"
                  data-testid="resolve-indication-btn"
                  className="btn btn-sm btn-outline-success"
                  onClick={() => setShowResolveModal(true)}
                >
                  ✓ Problem Appears Resolved
                </button>
              ) : null}
            </div>
            <h1 className="h4 fw-bold mb-0">{ticket.summary}</h1>
          </div>
          <div className="text-muted small text-md-end">
            <div><strong>Created:</strong> {formatDate(ticket.createdAt)}</div>
            <div><strong>Updated:</strong> {formatDate(ticket.updatedAt)}</div>
          </div>
        </div>

        {/* Read-Only Metadata Grid */}
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <div className="p-2 px-3 rounded zen-readonly">
              <div className="text-muted small">Requester</div>
              <div className="fw-semibold text-truncate">
                {ticket.requester?.name || currentRequester?.name}
              </div>
              <div className="small text-muted text-truncate">
                {ticket.requester?.email || currentRequester?.email}
              </div>
            </div>
          </div>

          <div className="col-6 col-md-4">
            <div className="p-2 px-3 rounded zen-readonly">
              <div className="text-muted small">Category</div>
              <div className="fw-semibold">{ticket.category?.name || "General"}</div>
            </div>
          </div>

          <div className="col-6 col-md-4">
            <div className="p-2 px-3 rounded zen-readonly">
              <div className="text-muted small">Related System</div>
              <div className="fw-semibold">{ticket.relatedSystem?.name || "General IT"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Description Card */}
      <div className="zen-card p-4 mb-4">
        <h2 className="h5 fw-bold mb-3" style={{ color: "var(--color-primary-green)" }}>
          Problem Description
        </h2>
        <div className="p-3 bg-light rounded border text-break" style={{ whiteSpace: "pre-wrap", minHeight: 120 }}>
          {ticket.description}
        </div>
      </div>

      {/* Attachments Section */}
      <div className="zen-card p-4 mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 mb-3 pb-3 border-bottom">
          <div>
            <h2 className="h5 fw-bold mb-1" style={{ color: "var(--color-primary-green)" }}>
              Attachments ({activeCount}/5)
            </h2>
            <p className="text-muted small mb-0">
              Files uploaded to support this ticket. (Max 5 active files, up to 5 MB each).
            </p>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileSelected}
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              id="detail-attachment-file-input"
            />
            <button
              type="button"
              className="btn btn-zen-secondary d-inline-flex align-items-center gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isQuotaFull || uploading}
              title={isQuotaFull ? "Attachment limit reached (5/5)" : "Upload new attachment"}
            >
              {uploading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <span>➕</span>
                  <span>Add Attachment</span>
                </>
              )}
            </button>
          </div>
        </div>

        {uploadError && (
          <div className="alert alert-danger p-2 small mb-3" role="alert">
            <strong>Upload Error:</strong> {uploadError}
          </div>
        )}

        {/* Attachments Grid */}
        {(!ticket.attachments || ticket.attachments.length === 0) ? (
          <div className="p-4 text-center text-muted bg-light rounded border">
            No attachments currently attached to this ticket.
          </div>
        ) : (
          <div className="row g-3">
            {ticket.attachments.map((att) => {
              const isPdf = att.mimeType.toLowerCase().includes("pdf") || att.fileName.toLowerCase().endsWith(".pdf");
              return (
                <div key={att.id} className="col-12 col-md-6">
                  <div
                    className={`p-3 rounded border h-100 d-flex flex-column justify-content-between ${
                      att.isRemoved ? "bg-light text-muted opacity-75" : "bg-white shadow-sm"
                    }`}
                  >
                    <div>
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                        <div className="d-flex align-items-center gap-2 overflow-hidden">
                          <span className="fs-3">{isPdf ? "📄" : "🖼️"}</span>
                          <div className="overflow-hidden">
                            <div
                              className={`fw-semibold text-truncate ${
                                att.isRemoved ? "text-decoration-line-through" : ""
                              }`}
                              title={att.fileName}
                            >
                              {att.fileName}
                            </div>
                            <div className="small text-muted">
                              {formatFileSize(att.fileSize)} • {formatDate(att.createdAt)}
                            </div>
                          </div>
                        </div>

                        {att.isRemoved && (
                          <span className="badge bg-secondary text-white">Removed</span>
                        )}
                      </div>

                      {att.isRemoved && (
                        <div className="p-2 mb-2 rounded bg-white border border-danger-subtle small text-danger">
                          <div className="fw-semibold">Reason for removal:</div>
                          <div className="fst-italic">"{att.removalReason}"</div>
                          <div className="text-muted mt-1" style={{ fontSize: "0.75rem" }}>
                            Removed on {formatDate(att.removedAt || undefined)} by {att.removedBy || "Requester"}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-2 pt-2 border-top">
                      {att.isRemoved ? (
                        <span className="text-muted small fst-italic">Download unavailable</span>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                            onClick={() => handleDownload(att)}
                          >
                            <span>⬇️</span>
                            <span>Download</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
                            onClick={() => {
                              setRemovingAttachment(att);
                              setRemovalReason("");
                              setRemovalError("");
                            }}
                          >
                            <span>🗑️</span>
                            <span>Remove</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lab 4 — Actions Taken Read-Only Section (AC-03, FR-04, UI-02) */}
      <div className="zen-card p-4 mb-4 card-actions-taken" data-testid="requester-actions-taken-section">
        <h2 className="h5 fw-bold mb-3" style={{ color: "var(--color-primary-green)" }}>
          🛠️ Actions Taken by IT Staff
        </h2>
        <p className="text-muted small mb-3">
          These are the technical actions recorded by IT Staff on this ticket. You can view but not modify them.
        </p>
        {actionsTaken.length === 0 ? (
          <div className="p-3 text-center text-muted bg-white rounded border" data-testid="requester-actions-empty">
            No actions have been recorded on this ticket yet.
          </div>
        ) : (
          <div className="d-flex flex-column gap-3" data-testid="requester-actions-list">
            {actionsTaken.map((action) => (
              <div key={action.id} className="p-3 item-action-taken" data-testid={`requester-action-item-${action.id}`}>
                <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
                  <span className="small text-muted fw-semibold">📅 {formatDate(action.actionDateTime)}</span>
                  <span className="small text-muted">by <strong>{action.performedBy.name}</strong></span>
                  {action.followUpRequired ? (
                    <span className="badge-follow-up-needed">⚠️ Follow-up Needed</span>
                  ) : (
                    <span className="badge-follow-up-none">No Follow-up</span>
                  )}
                </div>
                <div className="mb-1">
                  <span className="small fw-semibold text-muted text-uppercase" style={{ fontSize: "0.72rem" }}>Description</span>
                  <div className="small text-break" style={{ whiteSpace: "pre-wrap" }}>{action.actionDescription}</div>
                </div>
                <div className="mb-1">
                  <span className="small fw-semibold text-muted text-uppercase" style={{ fontSize: "0.72rem" }}>Result</span>
                  <div className="small text-break" style={{ whiteSpace: "pre-wrap" }}>{action.result}</div>
                </div>
                {action.attachmentNotes && (
                  <div className="mt-1">
                    <span className="small fw-semibold text-muted text-uppercase" style={{ fontSize: "0.72rem" }}>Attachment Notes: </span>
                    <span className="small fst-italic text-muted">{action.attachmentNotes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Public Comments Section (Lab 3 — AC-08, UI-spec 3.5) */}
      <div className="zen-card p-4 mb-4" data-testid="requester-comments-section">
        <h2 className="h5 fw-bold mb-3" style={{ color: "var(--color-primary-green)" }}>
          💬 Conversation with IT Support ({comments.length})
        </h2>

        {/* Existing Comments */}
        <div className="d-flex flex-column gap-3 mb-4" data-testid="requester-comments-list">
          {comments.length === 0 ? (
            <p className="text-muted small fst-italic mb-0">No comments exchanged yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="p-3 comment-item-public" data-testid={`comment-${c.id}`}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div className="d-flex align-items-center gap-2">
                    <strong className="small">{c.author.name}</strong>
                    <span className="badge-role-user">{c.author.role}</span>
                  </div>
                  <span className="text-muted small">{formatDate(c.createdAt)}</span>
                </div>
                <div className="small text-break" style={{ whiteSpace: "pre-wrap" }}>
                  {c.body}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Form */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const trimmed = newComment.trim();
            if (!trimmed || !ticket) return;
            setCommentSubmitting(true);
            setCommentError("");
            try {
              const added = await postPublicComment(ticket.id, trimmed);
              setComments((prev) => [...prev, added]);
              setNewComment("");
            } catch (err) {
              setCommentError(err instanceof Error ? err.message : "Failed to post comment.");
            } finally {
              setCommentSubmitting(false);
            }
          }}
        >
          <div className="mb-2">
            <textarea
              data-testid="requester-comment-input"
              className="form-control"
              rows={3}
              placeholder="Type a message or response to IT Support..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={commentSubmitting}
            />
          </div>
          {commentError && (
            <div className="alert alert-danger p-2 small mb-2">{commentError}</div>
          )}
          <button
            type="submit"
            data-testid="post-comment-btn"
            className="btn btn-zen-primary btn-sm px-3"
            disabled={commentSubmitting || !newComment.trim()}
          >
            {commentSubmitting ? "Posting..." : "Post Comment"}
          </button>
        </form>
      </div>

      {/* Problem Appears Resolved Confirmation Modal (AC-07) */}
      {showResolveModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content zen-card shadow">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold" style={{ color: "var(--color-primary-green)" }}>
                  ✓ Mark Problem as Appears Resolved
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowResolveModal(false)}
                  disabled={resolving}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-2">
                  Are you satisfied that this issue has been resolved?
                </p>
                <p className="small text-muted mb-0">
                  This notifies IT Staff that your issue is resolved so they can complete the ticket closure.
                </p>
                {resolveError && (
                  <div className="alert alert-danger p-2 small mt-3 mb-0">{resolveError}</div>
                )}
              </div>
              <div className="modal-footer border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowResolveModal(false)}
                  disabled={resolving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-zen-primary"
                  onClick={async () => {
                    if (!ticket) return;
                    setResolving(true);
                    setResolveError("");
                    try {
                      await indicateTicketResolution(ticket.id, true);
                      setTicket((prev) => (prev ? { ...prev, resolvedIndicated: true, resolvedIndicatedAt: new Date().toISOString() } : null));
                      setShowResolveModal(false);
                    } catch (err) {
                      setResolveError(err instanceof Error ? err.message : "Failed to submit resolution indication.");
                    } finally {
                      setResolving(false);
                    }
                  }}
                  disabled={resolving}
                  data-testid="confirm-resolve-btn"
                >
                  {resolving ? "Submitting..." : "Yes, Mark as Resolved"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Soft-Removal Confirmation Modal */}
      {removingAttachment && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content zen-card shadow">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-danger">
                  🗑️ Remove Attachment
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setRemovingAttachment(null)}
                  disabled={confirmingRemoval}
                  aria-label="Close"
                ></button>
              </div>

              <form onSubmit={handleConfirmSoftRemove}>
                <div className="modal-body">
                  <p className="mb-2">
                    Are you sure you want to remove{" "}
                    <strong>{removingAttachment.fileName}</strong>?
                  </p>
                  <p className="small text-muted mb-3">
                    Once removed, this attachment will no longer be downloadable or viewable.
                    In accordance with compliance policy, you must provide a reason for removal.
                  </p>

                  <div className="mb-3">
                    <label htmlFor="removal-reason-input" className="form-label fw-semibold small">
                      Removal Reason <span className="text-danger">*</span>
                    </label>
                    <textarea
                      id="removal-reason-input"
                      className="form-control"
                      rows={3}
                      placeholder="e.g. Uploaded incorrect file, contains personal data, obsolete document..."
                      value={removalReason}
                      onChange={(e) => setRemovalReason(e.target.value)}
                      disabled={confirmingRemoval}
                    ></textarea>
                    <div className="form-text">Minimum 3 characters required.</div>
                  </div>

                  {removalError && (
                    <div className="alert alert-danger p-2 small mb-0" role="alert">
                      {removalError}
                    </div>
                  )}
                </div>

                <div className="modal-footer border-top">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setRemovingAttachment(null)}
                    disabled={confirmingRemoval}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger"
                    disabled={confirmingRemoval}
                  >
                    {confirmingRemoval ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Removing...
                      </>
                    ) : (
                      "Confirm Removal"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
