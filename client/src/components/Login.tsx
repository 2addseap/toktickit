import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.js";

export default function Login() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Email address is required.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(trimmedEmail, password);
    } catch (err: any) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-zen-page py-5 px-3">
      <div className="card shadow-sm border-0 zen-card" style={{ maxWidth: "440px", width: "100%" }}>
        <div className="card-body p-4 p-md-5">
          {/* Header Brand */}
          <div className="text-center mb-4">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
              style={{
                width: "56px",
                height: "56px",
                backgroundColor: "var(--color-pale-green, #EAF6EF)",
                color: "var(--color-primary-green, #006B3C)",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h1 className="h4 fw-bold text-zen-main mb-1">Sign in to TokTickIT</h1>
            <p className="text-muted small mb-0">Enter your KMUTT credentials to continue</p>
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
              <svg className="me-2 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3 text-start">
              <label htmlFor="login-email" className="form-label small fw-medium mb-1 text-zen-main">
                Email Address <span className="text-danger">*</span>
              </label>
              <input
                id="login-email"
                type="email"
                className="form-control"
                placeholder="name@kmutt.ac.th"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                disabled={isSubmitting}
                style={{ height: "40px", borderRadius: "6px" }}
              />
            </div>

            <div className="mb-4 text-start">
              <label htmlFor="login-password" className="form-label small fw-medium mb-1 text-zen-main">
                Password <span className="text-danger">*</span>
              </label>
              <div className="position-relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="form-control pe-5"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  style={{ height: "40px", borderRadius: "6px" }}
                />
                <button
                  type="button"
                  className="btn position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent text-muted px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              className="btn btn-zen-primary w-100 fw-medium d-flex align-items-center justify-content-center"
              style={{ height: "42px", borderRadius: "6px" }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  <span>Signing in…</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Seed account hint for quick testing */}
          <div className="mt-4 pt-3 border-top text-center">
            <small className="text-muted d-block mb-1">Testing accounts:</small>
            <small className="text-muted font-monospace" style={{ fontSize: "0.75rem" }}>
              admin@kmutt.ac.th | jennifer.anderson@kmutt.ac.th
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
