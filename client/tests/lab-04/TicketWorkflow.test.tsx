import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import TicketDetail from "../../src/components/TicketDetail.js";
import * as api from "../../src/api.js";
import * as requesterContext from "../../src/context/RequesterContext.js";

// ============================================================
// Mock data
// ============================================================

const mockRequester = { id: 1, name: "Jennifer Requester", email: "jennifer@kmutt.ac.th", department: "HR", isActive: true };

const mockTicket: api.Ticket = {
  id: 42,
  ticketNumber: "TKT-2026-000042",
  requesterId: 1,
  requester: mockRequester,
  categoryId: 1,
  category: { id: 1, name: "Network" },
  relatedSystemId: 1,
  relatedSystem: { id: 1, name: "Campus Wi-Fi" },
  summary: "Intermittent Wi-Fi disconnections in CB2 Building",
  description: "Signal drops every 10-15 minutes on the 3rd floor.",
  requestedPriority: "HIGH",
  itPriority: null,
  status: "In Progress",
  resolvedIndicated: false,
  resolvedIndicatedAt: null,
  assignedToId: 10,
  assignedTo: { id: 10, name: "Alex IT Staff", email: "alex.it@kmutt.ac.th", role: "IT_STAFF" },
  createdAt: "2026-09-15T08:00:00Z",
  updatedAt: "2026-09-15T09:00:00Z",
  attachments: [],
};

const mockActions: api.ActionTaken[] = [
  {
    id: 301,
    ticketId: 42,
    performedById: 10,
    performedBy: { id: 10, name: "Alex IT Staff", email: "alex.it@kmutt.ac.th", role: "IT_STAFF" },
    actionDateTime: "2026-09-15T10:00:00Z",
    actionDescription: "Checked access point AP-CB2-301 and found firmware out of date.",
    result: "Firmware updated successfully. Monitoring signal quality.",
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: "ping-log-cb2-301.txt",
    createdAt: "2026-09-15T10:05:00Z",
    updatedAt: "2026-09-15T10:05:00Z",
  },
];

// ============================================================
// UI-02: Requester TicketDetail — read-only Actions Taken view
// ============================================================

describe("Lab 4 — UI-02: Actions Taken Read-Only View for Requester", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(requesterContext, "useRequester").mockReturnValue({
      currentRequester: mockRequester,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshRequester: vi.fn(),
    });
    vi.spyOn(api, "getTicketDetail").mockResolvedValue(mockTicket);
    vi.spyOn(api, "getPublicComments").mockResolvedValue([]);
    vi.spyOn(api, "getActionsTaken").mockResolvedValue(mockActions);
  });

  it("renders the Actions Taken section in read-only mode", async () => {
    render(<TicketDetail ticketId={42} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("requester-actions-taken-section")).toBeInTheDocument();
    });

    expect(screen.getByTestId("requester-actions-list")).toBeInTheDocument();
    expect(screen.getByTestId("requester-action-item-301")).toBeInTheDocument();
    expect(screen.getByText("Checked access point AP-CB2-301 and found firmware out of date.")).toBeInTheDocument();
    expect(screen.getByText("Firmware updated successfully. Monitoring signal quality.")).toBeInTheDocument();
    expect(screen.getByText(/ping-log-cb2-301.txt/)).toBeInTheDocument();
  });

  it("does NOT render an Add Action or Edit button for Requesters (AC-03)", async () => {
    render(<TicketDetail ticketId={42} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("requester-actions-taken-section")).toBeInTheDocument();
    });

    // No add or edit controls for requester
    expect(screen.queryByTestId("add-action-btn")).not.toBeInTheDocument();
    expect(screen.queryByTestId("edit-action-btn-301")).not.toBeInTheDocument();
    expect(screen.queryByTestId("action-form")).not.toBeInTheDocument();
  });

  it("shows empty state when no actions have been recorded yet", async () => {
    vi.spyOn(api, "getActionsTaken").mockResolvedValue([]);

    render(<TicketDetail ticketId={42} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("requester-actions-empty")).toBeInTheDocument();
    });

    expect(screen.getByText(/No actions have been recorded on this ticket yet/)).toBeInTheDocument();
  });

  it("shows follow-up badge when action has follow-up required", async () => {
    const withFollowUp: api.ActionTaken = {
      ...mockActions[0],
      id: 302,
      followUpRequired: true,
      followUpNote: "Please check again in 24 hours.",
    };
    vi.spyOn(api, "getActionsTaken").mockResolvedValue([withFollowUp]);

    render(<TicketDetail ticketId={42} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("requester-action-item-302")).toBeInTheDocument();
    });

    // Follow-up badge should be visible even in read-only mode
    expect(screen.getByText(/Follow-up Needed/)).toBeInTheDocument();
  });

  it("gracefully shows section even if getActionsTaken fails (safe failure — FR-07)", async () => {
    vi.spyOn(api, "getActionsTaken").mockRejectedValue(new Error("Network error"));

    render(<TicketDetail ticketId={42} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("requester-actions-taken-section")).toBeInTheDocument();
    });

    // Still shows the section (empty state) without crashing
    expect(screen.getByTestId("requester-actions-empty")).toBeInTheDocument();
  });
});
