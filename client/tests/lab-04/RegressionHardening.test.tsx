import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TicketDetail from "../../src/components/TicketDetail.js";
import StaffTicketDetail from "../../src/components/StaffTicketDetail.js";
import * as api from "../../src/api.js";
import * as authContext from "../../src/context/AuthContext.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";

const mockStaffUser: api.User = {
  id: 20,
  name: "Alex IT Staff",
  email: "alex.it@kmutt.ac.th",
  role: "IT_STAFF",
  mustChangePassword: false,
};

const mockRequesterUser: api.User = {
  id: 10,
  name: "Jennifer Requester",
  email: "jennifer@kmutt.ac.th",
  role: "REQUESTER",
  department: "Human Resources",
  mustChangePassword: false,
};

const mockLegacyTicket: api.Ticket = {
  id: 501,
  ticketNumber: "TKT-2026-000501",
  requesterId: 10,
  requester: {
    id: 10,
    name: "Jennifer Requester",
    email: "jennifer@kmutt.ac.th",
    department: "Human Resources",
    isActive: true,
  },
  categoryId: 1,
  category: { id: 1, name: "Network" },
  relatedSystemId: 1,
  relatedSystem: { id: 1, name: "Campus Wi-Fi" },
  summary: "Legacy ticket before Actions Taken existed",
  description: "Testing legacy ticket compatibility without crashing.",
  requestedPriority: "MEDIUM",
  itPriority: "MEDIUM",
  status: "Open",
  resolvedIndicated: false,
  resolvedIndicatedAt: null,
  assignedToId: null,
  assignedTo: null,
  createdAt: "2026-09-01T08:00:00Z",
  updatedAt: "2026-09-01T09:00:00Z",
  attachments: [],
};

describe("Lab 4 — Issue 5: UI Hardening, Edge Cases & Legacy Regression Tests", () => {
  beforeEach(() => {
    localStorage.setItem("toktickit_active_requester", JSON.stringify(mockRequesterUser));
    vi.restoreAllMocks();
    vi.spyOn(api, "getPublicComments").mockResolvedValue([]);
    vi.spyOn(api, "getInternalNotes").mockResolvedValue([]);
    vi.spyOn(api, "getStaffAssignees").mockResolvedValue([]);
  });

  it("TicketDetail: renders legacy ticket with 0 actions cleanly without crashing", async () => {
    vi.spyOn(authContext, "useAuth").mockReturnValue({
      currentUser: mockRequesterUser as any,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      changePassword: vi.fn(),
      token: "mock-token",
    });
    vi.spyOn(api, "getTicketDetail").mockResolvedValue(mockLegacyTicket);
    vi.spyOn(api, "getActionsTaken").mockResolvedValue([]); // Zero actions

    render(
      <RequesterProvider>
        <TicketDetail ticketId={501} onBack={vi.fn()} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-000501").length).toBeGreaterThanOrEqual(1);
    });

    // Check that Actions Taken empty state is rendered properly
    expect(screen.getByText(/No actions have been recorded on this ticket yet/i)).toBeInTheDocument();
    // Requesters should never see Add Action button
    expect(screen.queryByTestId("add-action-btn")).not.toBeInTheDocument();
  });

  it("StaffTicketDetail: renders legacy ticket and allows adding the first action taken", async () => {
    vi.spyOn(authContext, "useAuth").mockReturnValue({
      currentUser: mockStaffUser as any,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      changePassword: vi.fn(),
      token: "mock-token",
    });
    vi.spyOn(api, "getTicketDetail").mockResolvedValue(mockLegacyTicket);
    vi.spyOn(api, "getActionsTaken").mockResolvedValue([]);

    render(<StaffTicketDetail ticketId={501} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-000501").length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText(/No actions taken recorded yet/i)).toBeInTheDocument();
    expect(screen.getByTestId("add-action-btn")).toBeInTheDocument();
  });

  it("Form Protection: retains form input when action submission fails", async () => {
    vi.spyOn(authContext, "useAuth").mockReturnValue({
      currentUser: mockStaffUser as any,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      changePassword: vi.fn(),
      token: "mock-token",
    });
    vi.spyOn(api, "getTicketDetail").mockResolvedValue(mockLegacyTicket);
    vi.spyOn(api, "getActionsTaken").mockResolvedValue([]);

    render(<StaffTicketDetail ticketId={501} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("add-action-btn")).toBeInTheDocument();
    });

    // Open add action form
    await userEvent.click(screen.getByTestId("add-action-btn"));

    const descInput = screen.getByTestId("action-description-input");
    const resultInput = screen.getByTestId("action-result-input");

    await userEvent.type(descInput, "Diagnosed fiber cable in server room");
    await userEvent.type(resultInput, "Patch cable faulty; scheduled replacement");

    // Mock API failure on createActionTaken
    vi.spyOn(api, "createActionTaken").mockRejectedValue(new Error("Transient network outage"));

    const saveBtn = screen.getByTestId("save-action-btn");
    await userEvent.click(saveBtn);

    // Error feedback should be displayed
    await waitFor(() => {
      expect(screen.getByTestId("action-form-error")).toHaveTextContent("Transient network outage");
    });

    // Form inputs MUST be preserved so user does not lose their typed work!
    expect(descInput).toHaveValue("Diagnosed fiber cable in server room");
    expect(resultInput).toHaveValue("Patch cable faulty; scheduled replacement");
  });

  it("Safe Failure: handles getActionsTaken failure without crashing ticket detail", async () => {
    vi.spyOn(authContext, "useAuth").mockReturnValue({
      currentUser: mockStaffUser as any,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      changePassword: vi.fn(),
      token: "mock-token",
    });
    vi.spyOn(api, "getTicketDetail").mockResolvedValue(mockLegacyTicket);
    vi.spyOn(api, "getActionsTaken").mockRejectedValue(new Error("Database connection error"));

    render(<StaffTicketDetail ticketId={501} onBack={vi.fn()} />);

    // Ticket details should still load safely
    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-000501").length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText("Campus Wi-Fi")).toBeInTheDocument();
  });
});
