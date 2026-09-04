import { useState } from "react";
import { RequesterProvider, useRequester } from "./context/RequesterContext.js";
import Navbar from "./components/Navbar.js";
import RequesterSelect from "./components/RequesterSelect.js";

function MainContent() {
  const { currentRequester, isSelectorOpen } = useRequester();
  const [currentTab, setCurrentTab] = useState<"my-tickets" | "create-ticket">("my-tickets");

  if (!currentRequester || isSelectorOpen) {
    return <RequesterSelect />;
  }

  return (
    <div>
      <Navbar currentTab={currentTab} onTabChange={setCurrentTab} />

      <main className="container py-4">
        {currentTab === "my-tickets" && (
          <div className="zen-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h1 className="h3 fw-bold mb-1">My Tickets</h1>
                <p className="text-muted small mb-0">
                  Viewing tickets submitted by <strong>{currentRequester.name}</strong> ({currentRequester.email})
                </p>
              </div>
              <button
                type="button"
                className="btn btn-zen-primary"
                onClick={() => setCurrentTab("create-ticket")}
              >
                ➕ Create Ticket
              </button>
            </div>
            <div className="p-4 text-center text-muted bg-light rounded border">
              📋 My Tickets view will be fully implemented in Issue 4.
            </div>
          </div>
        )}

        {currentTab === "create-ticket" && (
          <div className="zen-card p-4" style={{ maxWidth: 840 }}>
            <h1 className="h3 fw-bold mb-3">Create New Support Ticket</h1>
            <p className="text-muted small mb-4">
              Submit a support request on behalf of <strong>{currentRequester.name}</strong>.
            </p>
            <div className="p-4 text-center text-muted bg-light rounded border">
              ✍️ Create Ticket form will be fully implemented in Issue 3.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <RequesterProvider>
      <MainContent />
    </RequesterProvider>
  );
}
