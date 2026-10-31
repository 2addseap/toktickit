import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StaffTicketDetail from "../../src/components/StaffTicketDetail.js";
import * as api from "../../src/api.js";
import * as authContext from "../../src/context/AuthContext.js";

// ============================================================
// Mock data
// ============================================================

const mockStaffUser: api.User = {
  id: 10,
  name: "Alex IT Staff",
  email: "alex.it@kmutt.ac.th",
  role: "IT_STAFF",
  mustChangePassword: false,
};

const mockTicket: api.Ticket = {
  id: 42,
  ticketNumber: "TKT-2026-000042",
  requesterId: 1,
  requester: { id: 1, name: "Jennifer Requester", email: "jennifer@kmutt.ac.th", department: "HR", isActive: true },
  categoryId: 1,
  category: { id: 1, name: "Network" },
  relatedSystemId: 1,
  relatedSystem: { id: 1, name: "Campus Wi-Fi" },
  summary: "Intermittent Wi-Fi disconnections in CB2 Building",
  description: "Signal drops every 10-15 minutes on the 3rd floor.",
  requestedPriority: "HIGH",
  itPriority: "MEDIUM",
  status: "Open",
  resolvedIndicated: false,
  resolvedIndicatedAt: null,
  assignedToId: null,
  assignedTo: null,
  createdAt: "2026-09-15T08:00:00Z",
  updatedAt: "2026-09-15T09:00:00Z",
  attachments: [],
};

const mockAssignees: api.StaffAssignee[] = [
  { id: 10, name: "Alex IT Staff", email: "alex.it@kmutt.ac.th", role: "IT_STAFF" },
];

const mockActions: api.ActionTaken[] = [
  {
    id: 201,
    ticketId: 42,
    performedById: 10,
    performedBy: { id: 10, name: "Alex IT Staff", email: "alex.it@kmutt.ac.th", role: "IT_STAFF" },
    actionDateTime: "2026-09-15T10:00:00Z",
    actionDescription: "Restarted access point AP-CB2-301 and updated firmware.",
    result: "Signal stabilized after restart. Monitoring for 30 minutes.",
    followUpRequired: true,
    followUpNote: "Need to check again tomorrow morning.",
    attachmentNotes: "Log: /var/log/ap-cb2-301.log",
    createdAt: "2026-09-15T10:05:00Z",
    updatedAt: "2026-09-15T10:05:00Z",
  },
];

// ============================================================
// UI-01: StaffTicketDetail — Actions Taken list & create form
// ============================================================

describe("Lab 4 — UI-01: Actions Taken Panel in Staff Ticket Detail", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authContext, "useAuth").mockReturnValue({
      currentUser: mockStaffUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      changePassword: vi.fn(),
      refreshUser: vi.fn(),
    });
    vi.spyOn(api, "getTicketDetail").mockResolvedValue(mockTicket);
    vi.spyOn(api, "getStaffAssignees").mockResolvedValue(mockAssignees);
    vi.spyOn(api, "getPublicComments").mockResolvedValue([]);
    vi.spyOn(api, "getInternalNotes").mockResolvedValue([]);
    vi.spyOn(api, "getActionsTaken").mockResolvedValue(mockActions);
  });

  it("renders the Actions Taken section with existing actions", async () => {
    render(<StaffTicketDetail ticketId={42} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("actions-taken-section")).toBeInTheDocument();
    });

    expect(screen.getByTestId("actions-taken-list")).toBeInTheDocument();
    expect(screen.getByTestId("action-item-201")).toBeInTheDocument();
    expect(screen.getByText("Restarted access point AP-CB2-301 and updated firmware.")).toBeInTheDocument();
    expect(screen.getByText("Signal stabilized after restart. Monitoring for 30 minutes.")).toBeInTheDocument();

    // Follow-up badge should appear
    expect(screen.getByTestId("follow-up-badge-201")).toBeInTheDocument();

    // Edit button should appear for each action
    expect(screen.getByTestId("edit-action-btn-201")).toBeInTheDocument();

    // Add Action button should be present
    expect(screen.getByTestId("add-action-btn")).toBeInTheDocument();
  });

  it("opens the Add Action form when Add Action Taken button is clicked", async () => {
    render(<StaffTicketDetail ticketId={42} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("add-action-btn")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId("add-action-btn"));

    expect(screen.getByTestId("action-form")).toBeInTheDocument();
    expect(screen.getByTestId("action-description-input")).toBeInTheDocument();
    expect(screen.getByTestId("action-result-input")).toBeInTheDocument();
    expect(screen.getByTestId("follow-up-required-checkbox")).toBeInTheDocument();
    expect(screen.getByTestId("save-action-btn")).toBeInTheDocument();
    expect(screen.getByTestId("cancel-action-btn")).toBeInTheDocument();
  });

  it("shows validation errors on empty form submit (AC-05 — follow-up co-dependency)", async () => {
    render(<StaffTicketDetail ticketId={42} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("add-action-btn")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId("add-action-btn"));
    await userEvent.click(screen.getByTestId("save-action-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("action-description-error")).toBeInTheDocument();
      expect(screen.getByTestId("action-result-error")).toBeInTheDocument();
    });
  });

  it("requires follow-up note when Follow-Up Required is checked (AC-05, BR-04)", async () => {
    render(<StaffTicketDetail ticketId={42} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("add-action-btn")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId("add-action-btn"));

    // Fill required fields
    await userEvent.type(screen.getByTestId("action-description-input"), "Replaced the faulty network cable.");
    await userEvent.type(screen.getByTestId("action-result-input"), "Connection is stable.");

    // Check follow-up required WITHOUT providing a note
    await userEvent.click(screen.getByTestId("follow-up-required-checkbox"));
    await userEvent.click(screen.getByTestId("save-action-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("follow-up-note-error")).toBeInTheDocument();
    });
  });

  it("successfully submits a new Action Taken and appends it to the list", async () => {
    const newAction: api.ActionTaken = {
      id: 999,
      ticketId: 42,
      performedById: 10,
      performedBy: { id: 10, name: "Alex IT Staff", email: "alex.it@kmutt.ac.th", role: "IT_STAFF" },
      actionDateTime: "2026-09-15T11:00:00Z",
      actionDescription: "Replaced the faulty network cable.",
      result: "Connection is stable.",
      followUpRequired: false,
      followUpNote: null,
      attachmentNotes: null,
      createdAt: "2026-09-15T11:05:00Z",
      updatedAt: "2026-09-15T11:05:00Z",
    };
    const createSpy = vi.spyOn(api, "createActionTaken").mockResolvedValue(newAction);

    render(<StaffTicketDetail ticketId={42} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("add-action-btn")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId("add-action-btn"));
    await userEvent.type(screen.getByTestId("action-description-input"), "Replaced the faulty network cable.");
    await userEvent.type(screen.getByTestId("action-result-input"), "Connection is stable.");
    await userEvent.click(screen.getByTestId("save-action-btn"));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalled();
      expect(screen.getByTestId("action-item-999")).toBeInTheDocument();
    });

    // Form should close after successful submit
    expect(screen.queryByTestId("action-form")).not.toBeInTheDocument();
  });

  it("opens Edit form with pre-populated data when Edit button is clicked", async () => {
    render(<StaffTicketDetail ticketId={42} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("edit-action-btn-201")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId("edit-action-btn-201"));

    await waitFor(() => {
      expect(screen.getByTestId("action-form")).toBeInTheDocument();
      expect(screen.getByTestId("action-description-input")).toHaveValue(
        "Restarted access point AP-CB2-301 and updated firmware."
      );
      expect(screen.getByTestId("action-result-input")).toHaveValue(
        "Signal stabilized after restart. Monitoring for 30 minutes."
      );
      expect(screen.getByTestId("follow-up-required-checkbox")).toBeChecked();
    });
  });

  it("shows empty state when no actions have been recorded", async () => {
    vi.spyOn(api, "getActionsTaken").mockResolvedValue([]);

    render(<StaffTicketDetail ticketId={42} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("actions-taken-empty")).toBeInTheDocument();
    });
  });
});

// ============================================================
// UI-03: Status Transition Dropdown — only permitted options
// ============================================================

describe("Lab 4 — UI-03: Permitted Status Transition Dropdown", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authContext, "useAuth").mockReturnValue({
      currentUser: mockStaffUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      changePassword: vi.fn(),
      refreshUser: vi.fn(),
    });
    vi.spyOn(api, "getStaffAssignees").mockResolvedValue(mockAssignees);
    vi.spyOn(api, "getPublicComments").mockResolvedValue([]);
    vi.spyOn(api, "getInternalNotes").mockResolvedValue([]);
    vi.spyOn(api, "getActionsTaken").mockResolvedValue([]);
  });

  it("shows only permitted transitions from Open status (In Progress, Waiting for Requester, Resolved, Cancelled)", async () => {
    vi.spyOn(api, "getTicketDetail").mockResolvedValue({ ...mockTicket, status: "Open" });

    render(<StaffTicketDetail ticketId={42} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("status-transition-select")).toBeInTheDocument();
    });

    const select = screen.getByTestId("status-transition-select");
    const options = Array.from(select.querySelectorAll("option")).map((o) => o.textContent || "");

    expect(options.some((o) => o.includes("In Progress"))).toBe(true);
    expect(options.some((o) => o.includes("Waiting for Requester"))).toBe(true);
    expect(options.some((o) => o.includes("Resolved"))).toBe(true);
    expect(options.some((o) => o.includes("Cancelled"))).toBe(true);
    // Should NOT show transitions that are not permitted from Open
    expect(options.some((o) => o.includes("Closed"))).toBe(false);
    expect(options.some((o) => o.includes("New"))).toBe(false);
  });

  it("shows terminal-state message for Cancelled tickets (no transitions)", async () => {
    vi.spyOn(api, "getTicketDetail").mockResolvedValue({ ...mockTicket, status: "Cancelled" });

    render(<StaffTicketDetail ticketId={42} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Terminal status/i)).toBeInTheDocument();
    });
  });

  it("shows only Closed and Reopened from Resolved status", async () => {
    vi.spyOn(api, "getTicketDetail").mockResolvedValue({ ...mockTicket, status: "Resolved" });

    render(<StaffTicketDetail ticketId={42} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("status-transition-select")).toBeInTheDocument();
    });

    const select = screen.getByTestId("status-transition-select");
    const options = Array.from(select.querySelectorAll("option")).map((o) => o.textContent || "");

    expect(options.some((o) => o.includes("Closed"))).toBe(true);
    expect(options.some((o) => o.includes("Reopened"))).toBe(true);
    expect(options.some((o) => o.includes("In Progress"))).toBe(false);
    expect(options.some((o) => o.includes("Cancelled"))).toBe(false);
  });

  it("passes updatedAt to updateTicketStatus for concurrency protection", async () => {
    vi.spyOn(api, "getTicketDetail").mockResolvedValue({ ...mockTicket, status: "Open" });
    const updateStatusSpy = vi.spyOn(api, "updateTicketStatus").mockResolvedValue({
      ...mockTicket,
      status: "In Progress",
      updatedAt: "2026-09-15T10:00:00Z",
      assignedTo: null,
      attachmentCount: 0,
    });

    render(<StaffTicketDetail ticketId={42} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("status-transition-select")).toBeInTheDocument();
    });

    const select = screen.getByTestId("status-transition-select");
    await userEvent.selectOptions(select, "In Progress");
    await userEvent.click(screen.getByTestId("update-status-btn"));

    await waitFor(() => {
      expect(updateStatusSpy).toHaveBeenCalledWith(42, "In Progress", mockTicket.updatedAt);
    });
  });
});
