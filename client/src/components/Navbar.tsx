import { useRequester } from "../context/RequesterContext.js";

interface NavbarProps {
  currentTab: "my-tickets" | "create-ticket";
  onTabChange: (tab: "my-tickets" | "create-ticket") => void;
}

export default function Navbar({ currentTab, onTabChange }: NavbarProps) {
  const { currentRequester, openSelector } = useRequester();

  return (
    <header className="zen-header py-2 px-3 mb-4">
      <div className="container-fluid d-flex flex-wrap align-items-center justify-content-between">
        {/* Brand */}
        <div className="d-flex align-items-center me-4">
          <span className="fs-4 fw-bold me-2 text-white">TokTickIT</span>
          <span className="badge bg-white text-success fw-semibold">IT Service Desk</span>
        </div>

        {/* Navigation Tabs */}
        {currentRequester && (
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
          </nav>
        )}

        {/* Right Side: Requester Identity & Switch Button */}
        <div className="d-flex align-items-center ms-auto">
          {currentRequester ? (
            <div className="user-profile-badge">
              <span className="fw-semibold">👤 {currentRequester.name}</span>
              {currentRequester.department && (
                <span className="text-white-50 small">({currentRequester.department})</span>
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
