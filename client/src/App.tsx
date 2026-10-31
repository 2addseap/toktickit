import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.js";
import { RequesterProvider, useRequester } from "./context/RequesterContext.js";
import Navbar from "./components/Navbar.js";
import RequesterSelect from "./components/RequesterSelect.js";
import CreateTicket from "./components/CreateTicket.js";
import MyTickets from "./components/MyTickets.js";
import TicketDetail from "./components/TicketDetail.js";
import Login from "./components/Login.js";
import ChangePassword from "./components/ChangePassword.js";
import UserManagement from "./components/UserManagement.js";
import StaffTicketQueue from "./components/StaffTicketQueue.js";
import StaffTicketDetail from "./components/StaffTicketDetail.js";
import RequesterDashboard from "./components/RequesterDashboard.js";
import StaffDashboard from "./components/StaffDashboard.js";

function MainContent() {
  const { currentUser, isLoading, isAuthenticated } = useAuth();
  const { currentRequester, isSelectorOpen } = useRequester();
  const [currentTab, setCurrentTab] = useState<"dashboard" | "my-tickets" | "create-ticket" | "user-management" | "ticket-queue">("dashboard");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [queueFilter, setQueueFilter] = useState<{ status?: string; priority?: string; assignedTo?: string; unassignedOnly?: boolean } | undefined>(undefined);
  const [myTicketsFilter, setMyTicketsFilter] = useState<string | undefined>(undefined);

  // Reset selected ticket if user or requester changes
  useEffect(() => {
    setSelectedTicketId(null);
  }, [currentUser?.id, currentRequester?.id]);

  // Loading indicator while verifying session
  if (isLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-zen-page">
        <div className="spinner-border text-success" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading session...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, present the secure Login screen
  if (!isAuthenticated) {
    return <Login />;
  }

  // If initial password change is mandatory, force Change Password screen (BR-02, AC-03)
  if (currentUser?.mustChangePassword) {
    return <ChangePassword />;
  }

  // Fallback to RequesterSelect if requester context not set
  if (!currentRequester && isSelectorOpen) {
    return <RequesterSelect />;
  }

  return (
    <div>
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setSelectedTicketId(null);
          setQueueFilter(undefined);
          setMyTicketsFilter(undefined);
          setCurrentTab(tab);
        }}
      />

      <main className="container py-4">
        {selectedTicketId ? (
          currentUser?.role === "IT_STAFF" || currentUser?.role === "ADMINISTRATOR" ? (
            <StaffTicketDetail
              ticketId={selectedTicketId}
              onBack={() => setSelectedTicketId(null)}
            />
          ) : (
            <TicketDetail
              ticketId={selectedTicketId}
              onBack={() => setSelectedTicketId(null)}
            />
          )
        ) : (
          <>
            {currentTab === "dashboard" && (
              currentUser?.role === "IT_STAFF" || currentUser?.role === "ADMINISTRATOR" ? (
                <StaffDashboard
                  onSelectTicket={(ticketId) => setSelectedTicketId(ticketId)}
                  onNavigateToQueue={(filter) => {
                    const queueOpts = filter ? {
                      status: filter.status,
                      priority: filter.itPriority,
                      assignedTo: filter.assignedTo,
                      unassignedOnly: filter.assignedTo === "unassigned",
                    } : undefined;
                    setQueueFilter(queueOpts);
                    setCurrentTab("ticket-queue");
                  }}
                  onCreateTicket={() => setCurrentTab("create-ticket")}
                  onNavigateToUserManagement={() => setCurrentTab("user-management")}
                />
              ) : (
                <RequesterDashboard
                  onCreateTicket={() => setCurrentTab("create-ticket")}
                  onSelectTicket={(ticketId) => setSelectedTicketId(ticketId)}
                  onViewAllTickets={(filter) => {
                    setMyTicketsFilter(filter);
                    setCurrentTab("my-tickets");
                  }}
                />
              )
            )}

            {currentTab === "my-tickets" && (
              <MyTickets
                onCreateTicket={() => setCurrentTab("create-ticket")}
                onSelectTicket={(ticketId) => setSelectedTicketId(ticketId)}
                initialStatus={myTicketsFilter}
              />
            )}

            {currentTab === "create-ticket" && (
              <CreateTicket
                onSuccess={() => {
                  // Stay on confirmation screen or allow navigating to my-tickets
                }}
                onCancel={() => setCurrentTab("my-tickets")}
              />
            )}

            {currentTab === "ticket-queue" && (currentUser?.role === "IT_STAFF" || currentUser?.role === "ADMINISTRATOR") && (
              <StaffTicketQueue
                onSelectTicket={(ticketId) => setSelectedTicketId(ticketId)}
                initialFilter={queueFilter}
              />
            )}

            {currentTab === "user-management" && currentUser?.role === "ADMINISTRATOR" && (
              <UserManagement />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RequesterProvider>
        <MainContent />
      </RequesterProvider>
    </AuthProvider>
  );
}
