import { useState } from "react";
import { RequesterProvider, useRequester } from "./context/RequesterContext.js";
import Navbar from "./components/Navbar.js";
import RequesterSelect from "./components/RequesterSelect.js";
import CreateTicket from "./components/CreateTicket.js";
import MyTickets from "./components/MyTickets.js";

function MainContent() {
  const { currentRequester, isSelectorOpen } = useRequester();
  const [currentTab, setCurrentTab] = useState<"my-tickets" | "create-ticket">("my-tickets");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  if (!currentRequester || isSelectorOpen) {
    return <RequesterSelect />;
  }

  return (
    <div>
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setSelectedTicketId(null);
          setCurrentTab(tab);
        }}
      />

      <main className="container py-4">
        {currentTab === "my-tickets" && (
          <MyTickets
            onCreateTicket={() => setCurrentTab("create-ticket")}
            onSelectTicket={(ticketId) => {
              setSelectedTicketId(ticketId);
              // In Issue 5, this will open the TicketDetail component
              console.log("Selected ticket:", ticketId);
            }}
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
