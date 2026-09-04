import { useState, useEffect } from "react";
import { getRequesters, RequesterUser } from "../api.js";
import { useRequester } from "../context/RequesterContext.js";

export default function RequesterSelect() {
  const { currentRequester, setCurrentRequester, closeSelector } = useRequester();

  const [requesters, setRequesters] = useState<RequesterUser[]>([]);
  const [selectedId, setSelectedId] = useState<number | "">(
    currentRequester ? currentRequester.id : ""
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchRequesters();
  }, []);

  async function fetchRequesters() {
    setLoading(true);
    setError("");
    try {
      const data = await getRequesters();
      setRequesters(data);
      if (data.length > 0 && !currentRequester) {
        setSelectedId(data[0].id);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load development requesters"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleContinue() {
    if (!selectedId) return;
    const chosen = requesters.find((r) => r.id === Number(selectedId));
    if (chosen) {
      setCurrentRequester(chosen);
      closeSelector();
    }
  }

  return (
    <div className="container py-5">
      <div
        className="zen-card mx-auto p-4 p-md-5 shadow-sm"
        style={{ maxWidth: 540 }}
      >
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center bg-light text-success rounded-circle mb-3"
            style={{ width: 64, height: 64, fontSize: 32 }}
          >
            👤
          </div>
          <h1 className="h4 fw-bold mb-1">Select Development Requester</h1>
          <p className="text-muted small">
            Choose a development requester to simulate the current user context for Lab 2.
          </p>
        </div>

        {/* Informational Callout */}
        <div
          className="p-3 mb-4 rounded-3 border"
          style={{ backgroundColor: "var(--color-pale-green)", borderColor: "#C8E6C9" }}
        >
          <div className="d-flex align-items-start">
            <span className="me-2 fs-5">ℹ️</span>
            <div className="small">
              <strong>Testing Notice:</strong> This selector is a testing mechanism to simulate multi-user ownership before full authentication is introduced in Lab 3.
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-4" role="status">
            <div className="spinner-border text-success mb-2" role="status" />
            <div className="text-muted small">Loading active development requesters…</div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="alert alert-danger" role="alert">
            <div className="fw-semibold mb-1">Unable to load requesters</div>
            <div className="small mb-2">{error}</div>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={fetchRequesters}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && requesters.length === 0 && (
          <div className="alert alert-warning text-center">
            No active development requesters found in the database.
          </div>
        )}

        {/* Selection Form */}
        {!loading && !error && requesters.length > 0 && (
          <div>
            <div className="mb-4">
              <label htmlFor="requester-select" className="form-label fw-semibold">
                Development Requester <span className="text-danger">*</span>
              </label>
              <select
                id="requester-select"
                className="form-select zen-select"
                value={selectedId}
                onChange={(e) => setSelectedId(Number(e.target.value))}
              >
                {requesters.map((req) => (
                  <option key={req.id} value={req.id}>
                    {req.name} {req.department ? `(${req.department})` : ""} — {req.email}
                  </option>
                ))}
              </select>
              <div className="form-text text-muted small mt-1">
                Only active development requesters are listed.
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center">
              {currentRequester && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closeSelector}
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                className="btn btn-zen-primary ms-auto px-4"
                onClick={handleContinue}
                disabled={!selectedId}
              >
                Continue →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
