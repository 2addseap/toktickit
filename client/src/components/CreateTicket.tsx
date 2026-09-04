import React, { useState, useEffect, useRef } from "react";
import {
  getCategories,
  getRelatedSystems,
  createTicket,
  Category,
  RelatedSystem,
  Ticket,
} from "../api.js";
import { useRequester } from "../context/RequesterContext.js";

interface CreateTicketProps {
  onSuccess?: (ticket: Ticket) => void;
  onCancel?: () => void;
}

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function CreateTicket({ onSuccess, onCancel }: CreateTicketProps) {
  const { currentRequester } = useRequester();

  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);
  const [loadingRefData, setLoadingRefData] = useState<boolean>(true);

  // Form State
  const [categoryId, setCategoryId] = useState<string>("");
  const [relatedSystemId, setRelatedSystemId] = useState<string>("");
  const [requestedPriority, setRequestedPriority] = useState<string>("MEDIUM");
  const [summary, setSummary] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [attachments, setAttachments] = useState<File[]>([]);

  // Feedback State
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [attachmentError, setAttachmentError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string>("");
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadReferenceData() {
      setLoadingRefData(true);
      try {
        const [cats, systems] = await Promise.all([
          getCategories(),
          getRelatedSystems(),
        ]);
        setCategories(cats);
        setRelatedSystems(systems);
        if (cats.length > 0) setCategoryId(String(cats[0].id));
        if (systems.length > 0) setRelatedSystemId(String(systems[0].id));
      } catch {
        setGeneralError("Failed to load reference categories or related systems.");
      } finally {
        setLoadingRefData(false);
      }
    }
    loadReferenceData();
  }, []);

  function handleFileSelection(e: React.ChangeEvent<HTMLInputElement>) {
    setAttachmentError("");
    if (!e.target.files) return;

    const filesArray = Array.from(e.target.files);
    const validFiles: File[] = [];

    if (attachments.length + filesArray.length > 5) {
      setAttachmentError("Maximum 5 attachments are allowed per ticket.");
      return;
    }

    for (const file of filesArray) {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setAttachmentError(`"${file.name}" has an invalid format. Only JPG, PNG, WEBP, and PDF files are allowed.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setAttachmentError(`"${file.name}" exceeds the maximum 5 MB limit.`);
        return;
      }
      validFiles.push(file);
    }

    setAttachments((prev) => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setAttachmentError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentRequester) return;

    setFieldErrors({});
    setGeneralError("");

    // Client-side validation
    const errors: Record<string, string> = {};
    if (!categoryId) errors.categoryId = "Please select a category.";
    if (!relatedSystemId) errors.relatedSystemId = "Please select a related system.";

    const trimmedSummary = summary.trim();
    if (!trimmedSummary || trimmedSummary.length < 5 || trimmedSummary.length > 100) {
      errors.summary = "Summary is required and must be between 5 and 100 characters.";
    }

    const trimmedDescription = description.trim();
    if (!trimmedDescription || trimmedDescription.length < 10 || trimmedDescription.length > 2000) {
      errors.description = "Description is required and must be between 10 and 2000 characters.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("categoryId", categoryId);
      formData.append("relatedSystemId", relatedSystemId);
      formData.append("requestedPriority", requestedPriority);
      formData.append("summary", trimmedSummary);
      formData.append("description", trimmedDescription);

      for (const file of attachments) {
        formData.append("attachments", file);
      }

      const ticket = await createTicket(formData, currentRequester.id);
      setCreatedTicket(ticket);
      if (onSuccess) onSuccess(ticket);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "fieldErrors" in err) {
        setFieldErrors((err as { fieldErrors: Record<string, string> }).fieldErrors || {});
      }
      setGeneralError(
        err instanceof Error ? err.message : "Failed to create support ticket. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setCreatedTicket(null);
    setSummary("");
    setDescription("");
    setAttachments([]);
    setFieldErrors({});
    setGeneralError("");
  }

  // Success Confirmation Screen
  if (createdTicket) {
    return (
      <div className="zen-card p-4 p-md-5 mx-auto text-center" style={{ maxWidth: 680 }}>
        <div
          className="d-inline-flex align-items-center justify-content-center bg-success text-white rounded-circle mb-3"
          style={{ width: 64, height: 64, fontSize: 32 }}
        >
          ✓
        </div>
        <h2 className="h3 fw-bold text-success mb-2">Ticket Created Successfully!</h2>
        <p className="text-muted mb-4">
          Your support request has been logged and assigned an official tracking number.
        </p>

        <div
          className="p-3 mb-4 rounded-3 border mx-auto text-start"
          style={{ backgroundColor: "var(--color-pale-green)", maxWidth: 500 }}
        >
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted small">Ticket Number:</span>
            <span className="fw-bold fs-5 text-success">{createdTicket.ticketNumber}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted small">Requester:</span>
            <span className="fw-semibold">{createdTicket.requester?.name || currentRequester?.name}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted small">Category:</span>
            <span>{createdTicket.category?.name}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted small">Priority:</span>
            <span className="badge bg-warning text-dark">{createdTicket.requestedPriority}</span>
          </div>
          <div className="d-flex justify-content-between">
            <span className="text-muted small">Initial Status:</span>
            <span className="badge bg-primary">{createdTicket.status}</span>
          </div>
        </div>

        <div className="d-flex justify-content-center gap-3">
          {onCancel && (
            <button
              type="button"
              className="btn btn-zen-secondary"
              onClick={onCancel}
            >
              📋 View in My Tickets
            </button>
          )}
          <button
            type="button"
            className="btn btn-zen-primary"
            onClick={handleReset}
          >
            ➕ Create Another Ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="zen-card p-4 p-md-5 mx-auto shadow-sm" style={{ maxWidth: 880 }}>
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <div>
          <h1 className="h3 fw-bold mb-1">Create Support Ticket</h1>
          <p className="text-muted small mb-0">
            Submit an IT request. Required fields are marked with a red asterisk (
            <span className="text-danger">*</span>).
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={onCancel}
          >
            ← Back
          </button>
        )}
      </div>

      {generalError && (
        <div className="alert alert-danger" role="alert">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Section 1: System-Generated / Read-Only Metadata */}
        <div className="p-3 mb-4 rounded-3 border" style={{ backgroundColor: "var(--color-readonly-bg)" }}>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label small text-muted mb-1">Ticket Number</label>
              <input
                type="text"
                className="form-control form-control-sm zen-readonly"
                value="Generated automatically upon submission"
                readOnly
                disabled
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small text-muted mb-1">Ticket Date</label>
              <input
                type="text"
                className="form-control form-control-sm zen-readonly"
                value={new Date().toLocaleDateString(undefined, { dateStyle: "medium" })}
                readOnly
                disabled
              />
            </div>
            <div className="col-md-4">
              <label className="form-label small text-muted mb-1">Requester</label>
              <input
                type="text"
                className="form-control form-control-sm zen-readonly"
                value={`${currentRequester?.name || "Unknown"} (${currentRequester?.department || "General"})`}
                readOnly
                disabled
              />
            </div>
          </div>
        </div>

        {/* Section 2: Classification */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <label htmlFor="category-select" className="form-label fw-semibold">
              Category <span className="text-danger">*</span>
            </label>
            <select
              id="category-select"
              className={`form-select zen-select ${fieldErrors.categoryId ? "is-invalid" : ""}`}
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setFieldErrors((prev) => ({ ...prev, categoryId: "" }));
              }}
              disabled={loadingRefData}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {fieldErrors.categoryId && (
              <div className="invalid-feedback">{fieldErrors.categoryId}</div>
            )}
          </div>

          <div className="col-md-4">
            <label htmlFor="system-select" className="form-label fw-semibold">
              Related System <span className="text-danger">*</span>
            </label>
            <select
              id="system-select"
              className={`form-select zen-select ${fieldErrors.relatedSystemId ? "is-invalid" : ""}`}
              value={relatedSystemId}
              onChange={(e) => {
                setRelatedSystemId(e.target.value);
                setFieldErrors((prev) => ({ ...prev, relatedSystemId: "" }));
              }}
              disabled={loadingRefData}
            >
              {relatedSystems.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {fieldErrors.relatedSystemId && (
              <div className="invalid-feedback">{fieldErrors.relatedSystemId}</div>
            )}
          </div>

          <div className="col-md-4">
            <label htmlFor="priority-select" className="form-label fw-semibold">
              Requested Priority
            </label>
            <select
              id="priority-select"
              className="form-select zen-select"
              value={requestedPriority}
              onChange={(e) => setRequestedPriority(e.target.value)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        {/* Section 3: Summary */}
        <div className="mb-4">
          <div className="d-flex justify-content-between">
            <label htmlFor="ticket-summary" className="form-label fw-semibold">
              Ticket Summary <span className="text-danger">*</span>
            </label>
            <span className="text-muted small">{summary.length}/100</span>
          </div>
          <input
            id="ticket-summary"
            type="text"
            maxLength={100}
            className={`form-control zen-input ${fieldErrors.summary ? "is-invalid" : ""}`}
            placeholder="Brief 1-line summary of the issue (e.g. Cannot connect to Campus Wi-Fi)"
            value={summary}
            onChange={(e) => {
              setSummary(e.target.value);
              setFieldErrors((prev) => ({ ...prev, summary: "" }));
            }}
          />
          {fieldErrors.summary && (
            <div className="invalid-feedback">{fieldErrors.summary}</div>
          )}
        </div>

        {/* Section 4: Description */}
        <div className="mb-4">
          <div className="d-flex justify-content-between">
            <label htmlFor="ticket-description" className="form-label fw-semibold">
              Description <span className="text-danger">*</span>
            </label>
            <span className="text-muted small">{description.length}/2000</span>
          </div>
          <textarea
            id="ticket-description"
            rows={5}
            maxLength={2000}
            className={`form-control ${fieldErrors.description ? "is-invalid" : ""}`}
            placeholder="Provide complete details, error messages, and troubleshooting steps you have attempted…"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setFieldErrors((prev) => ({ ...prev, description: "" }));
            }}
          />
          {fieldErrors.description && (
            <div className="invalid-feedback">{fieldErrors.description}</div>
          )}
        </div>

        {/* Section 5: Attachments Dropzone */}
        <div className="mb-4">
          <label className="form-label fw-semibold">
            Supporting Attachments <span className="text-muted fw-normal">(Optional, max 5 files)</span>
          </label>

          <div
            className="p-3 text-center rounded border border-2 border-dashed bg-light mb-2"
            style={{ borderColor: "#C8E6C9" }}
          >
            <div className="mb-2">📁 Attach screenshots, logs, or error documents</div>
            <div className="text-muted small mb-2">
              Allowed types: <strong>JPG, PNG, WEBP, PDF</strong> (Max 5 MB each)
            </div>
            <input
              ref={fileInputRef}
              type="file"
              id="file-upload-input"
              multiple
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              className="d-none"
              onChange={handleFileSelection}
              disabled={attachments.length >= 5}
            />
            <button
              type="button"
              className="btn btn-sm btn-outline-success"
              onClick={() => fileInputRef.current?.click()}
              disabled={attachments.length >= 5}
            >
              Browse Files…
            </button>
          </div>

          {attachmentError && (
            <div className="text-danger small mb-2">{attachmentError}</div>
          )}

          {/* Selected Files List */}
          {attachments.length > 0 && (
            <div className="d-flex flex-wrap gap-2 mt-2">
              {attachments.map((file, idx) => (
                <div
                  key={idx}
                  className="badge bg-white text-dark border p-2 d-flex align-items-center gap-2 shadow-sm"
                >
                  <span>📎 {file.name}</span>
                  <span className="text-muted small">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    type="button"
                    className="btn-close btn-close-sm ms-1"
                    aria-label="Remove attachment"
                    onClick={() => removeAttachment(idx)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="d-flex justify-content-end gap-2 pt-3 border-top">
          {onCancel && (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn btn-zen-primary px-4"
            disabled={submitting || loadingRefData}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" />
                Submitting…
              </>
            ) : (
              "Submit Ticket"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
