import { useRequester } from "../context/RequesterContext.js";
import { useAuth } from "../context/AuthContext.js";

interface NavbarProps {
  currentTab: "my-tickets" | "create-ticket" | "user-management" | "ticket-queue";
  onTabChange: (tab: "my-tickets" | "create-ticket" | "user-management" | "ticket-queue") => void;
}

export default function Navbar({ currentTab, onTabChange }: NavbarProps) {
  const { currentRequester, openSelector } = useRequester();
  let authContext: any = null;
  try {
    authContext = useAuth();
  } catch {
    // Graceful fallback if AuthProvider is not in tree
  }

  const currentUser = authContext?.currentUser;
  const logout = authContext?.logout;

  const renderRoleBadge = (role?: string) => {
    if (!role) return null;
    if (role === "ADMINISTRATOR") {
      return <span className="badge bg-warning text-dark fw-semibold ms-2">Administrator</span>;
    }
    if (role === "IT_STAFF") {
      return <span className="badge bg-info text-dark fw-semibold ms-2">IT Staff</span>;
    }
    return <span className="badge bg-white text-success fw-semibold ms-2">Requester</span>;
  };

  return (
    <header className="zen-header py-2 px-3 mb-4">
      <div className="container-fluid d-flex flex-wrap align-items-center justify-content-between">
        {/* Brand */}
        <div className="d-flex align-items-center me-4">
          <span className="fs-4 fw-bold me-2 text-white">TokTickIT</span>
          <span className="badge bg-white text-success fw-semibold">IT Service Desk</span>
        </div>

        {/* Navigation Tabs */}
        {(currentUser || currentRequester) && (
          <nav className="d-flex align-items-center gap-2">
            <button
              type="button"
              className={`btn btn-link zen-nav-link ${currentTab === "my-tickets" ? "active" : ""}`}
              onClick={() => onTabChange("my-tickets")}
            >
              📋 My Tickets
            </button>
            <button
              type="button"
              className={`btn btn-link zen-nav-link ${currentTab === "create-ticket" ? "active" : ""}`}
              onClick={() => onTabChange("create-ticket")}
            >
              ➕ Create Ticket
            </button>
            {(currentUser?.role === "IT_STAFF" || currentUser?.role === "ADMINISTRATOR") && (
              <button
                type="button"
                className={`btn btn-link zen-nav-link ${currentTab === "ticket-queue" ? "active" : ""}`}
                onClick={() => onTabChange("ticket-queue")}
                data-testid="nav-ticket-queue"
              >
                🎫 Ticket Queue
              </button>
            )}
            {currentUser?.role === "ADMINISTRATOR" && (
              <button
                type="button"
                className={`btn btn-link zen-nav-link ${currentTab === "user-management" ? "active" : ""}`}
                onClick={() => onTabChange("user-management")}
                data-testid="nav-user-management"
              >
                👥 User Management
              </button>
            )}
          </nav>
        )}

        {/* Right Side: Identity & Actions */}
        <div className="d-flex align-items-center ms-auto">
          {currentUser ? (
            <div className="user-profile-badge d-flex align-items-center">
              <span className="fw-semibold">👤 {currentUser.name}</span>
              {renderRoleBadge(currentUser.role)}
              <button
                type="button"
                className="btn btn-sm btn-outline-light ms-3 py-1 px-2 rounded"
                onClick={() => logout && logout()}
                title="Sign Out"
              >
                Sign Out
              </button>
            </div>
          ) : currentRequester ? (
            <div className="user-profile-badge">
              <span className="fw-semibold">👤 {currentRequester.name}</span>
              {currentRequester.department && (
                <span className="text-white-50 small ms-1">({currentRequester.department})</span>
              )}
              <button
                type="button"
                className="btn btn-sm btn-outline-light ms-2 py-0 px-2 rounded-pill"
                onClick={openSelector}
                title="Switch Development Requester"
              >
                Change
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-sm btn-light fw-semibold"
              onClick={openSelector}
            >
              Select Requester
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
