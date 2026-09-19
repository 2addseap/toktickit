import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.js";

export default function ChangePassword() {
  const { changePassword, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Rule Evaluation
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasCase = hasUpper && hasLower;
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);
  const isDistinct = newPassword !== "" && currentPassword !== "" && newPassword !== currentPassword;
  const isMatching = newPassword !== "" && newPassword === confirmPassword;

  const isFormValid = hasMinLength && hasCase && hasNumberOrSymbol && isDistinct && isMatching;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!currentPassword) {
      setError("Please enter your current temporary password.");
      return;
    }
    if (!isFormValid) {
      setError("Please satisfy all password complexity criteria before saving.");
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-zen-page py-5 px-3">
      <div className="card shadow-sm border-0 zen-card" style={{ maxWidth: "480px", width: "100%" }}>
        <div className="card-body p-4 p-md-5">
          {/* Header */}
          <div className="text-center mb-4">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{
                width: "56px",
                height: "56px",
                backgroundColor: "var(--color-warning-bg, #FEF9E7)",
                color: "var(--color-warning, #B78103)",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="h4 fw-bold text-zen-main mb-1">Change Your Password</h1>
            <p className="text-muted small mb-0">You must change your initial temporary password to continue</p>
          </div>

          {/* Notice Alert */}
          <div
            className="alert py-2 px-3 mb-4 d-flex align-items-center"
            style={{
              backgroundColor: "var(--color-pale-green, #EAF6EF)",
              color: "var(--color-secondary-green, #0B7A46)",
              border: "1px solid #C6E7D2",
              borderRadius: "6px",
              fontSize: "0.85rem",
            }}
          >
            <span className="me-2 fs-6">🔒</span>
            <span>Initial password change is required to secure your account.</span>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              className="alert py-2 px-3 mb-4 d-flex align-items-center"
              style={{
                backgroundColor: "var(--color-error-bg, #FDF2F2)",
                color: "var(--color-error, #B3261E)",
                border: "1px solid #F5C6CB",
                borderRadius: "6px",
                fontSize: "0.875rem",
              }}
            >
              <span className="me-2">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Change Password Form */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Current Password */}
            <div className="mb-3 text-start">
              <label htmlFor="current-password" className="form-label small fw-medium mb-1 text-zen-main">
                Current (Temporary) Password <span className="text-danger">*</span>
              </label>
              <div className="position-relative">
                <input
                  id="current-password"
                  type={showCurrent ? "text" : "password"}
                  className="form-control pe-5"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isSubmitting}
                  style={{ height: "40px", borderRadius: "6px" }}
                />
                <button
                  type="button"
                  className="btn position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent text-muted px-3"
                  onClick={() => setShowCurrent(!showCurrent)}
                  tabIndex={-1}
                  aria-label="Toggle current password"
                >
                  {showCurrent ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="mb-3 text-start">
              <label htmlFor="new-password" className="form-label small fw-medium mb-1 text-zen-main">
                New Password <span className="text-danger">*</span>
              </label>
              <div className="position-relative">
                <input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  className="form-control pe-5"
                  placeholder="Create a strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSubmitting}
                  style={{ height: "40px", borderRadius: "6px" }}
                />
                <button
                  type="button"
                  className="btn position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent text-muted px-3"
                  onClick={() => setShowNew(!showNew)}
                  tabIndex={-1}
                  aria-label="Toggle new password"
                >
                  {showNew ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="mb-4 text-start">
              <label htmlFor="confirm-password" className="form-label small fw-medium mb-1 text-zen-main">
                Confirm New Password <span className="text-danger">*</span>
              </label>
              <div className="position-relative">
                <input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  className="form-control pe-5"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  style={{ height: "40px", borderRadius: "6px" }}
                />
                <button
                  type="button"
                  className="btn position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent text-muted px-3"
                  onClick={() => setShowConfirm(!showConfirm)}
                  tabIndex={-1}
                  aria-label="Toggle confirm password"
                >
                  {showConfirm ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Dynamic Real-time Complexity Checklist */}
            <div
              className="p-3 mb-4 rounded text-start"
              style={{
                backgroundColor: "#F8FAF9",
                border: "1px solid var(--color-border-subtle, #E0E6E3)",
                fontSize: "0.825rem",
              }}
            >
              <div className="fw-semibold text-zen-main mb-2">Password must:</div>
              <ul className="list-unstyled mb-0 d-flex flex-column gap-1">
                <li className={hasMinLength ? "text-success fw-medium" : "text-muted"}>
                  <span className="me-2">{hasMinLength ? "✓" : "○"}</span>
                  Be at least 8 characters in length
                </li>
                <li className={hasCase ? "text-success fw-medium" : "text-muted"}>
                  <span className="me-2">{hasCase ? "✓" : "○"}</span>
                  Include uppercase and lowercase letters
                </li>
                <li className={hasNumberOrSymbol ? "text-success fw-medium" : "text-muted"}>
                  <span className="me-2">{hasNumberOrSymbol ? "✓" : "○"}</span>
                  Include a number or special character
                </li>
                <li className={isDistinct ? "text-success fw-medium" : "text-muted"}>
                  <span className="me-2">{isDistinct ? "✓" : "○"}</span>
                  Must not match temporary password
                </li>
                <li className={isMatching ? "text-success fw-medium" : "text-muted"}>
                  <span className="me-2">{isMatching ? "✓" : "○"}</span>
                  Passwords match
                </li>
              </ul>
            </div>

            <button
              id="change-password-submit-btn"
              type="submit"
              className="btn btn-zen-primary w-100 fw-medium d-flex align-items-center justify-content-center mb-2"
              style={{ height: "42px", borderRadius: "6px" }}
              disabled={isSubmitting || !isFormValid}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  <span>Updating password…</span>
                </>
              ) : (
                "Save New Password"
              )}
            </button>

            <button
              type="button"
              className="btn btn-outline-secondary w-100 btn-sm text-muted"
              onClick={() => logout()}
              disabled={isSubmitting}
            >
              Cancel & Sign Out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
