import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StaffTicketDetail from "../../src/components/StaffTicketDetail.js";
import * as api from "../../src/api.js";
import * as authContext from "../../src/context/AuthContext.js";

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
  requester: {
    id: 1,
    name: "Jennifer Requester",
    email: "jennifer@kmutt.ac.th",
    department: "Human Resources",
    isActive: true,
  },
  categoryId: 1,
  category: { id: 1, name: "Network" },
  relatedSystemId: 1,
  relatedSystem: { id: 1, name: "Campus Wi-Fi" },
  summary: "Intermittent Wi-Fi disconnections in CB2 Building",
  description: "Signal drops every 10-15 minutes on the 3rd floor.",
  requestedPriority: "HIGH",
  itPriority: "MEDIUM",
  status: "Open",
  resolvedIndicated: true,
  resolvedIndicatedAt: "2026-09-15T10:30:00Z",
  assignedToId: null,
  assignedTo: null,
  createdAt: "2026-09-15T08:00:00Z",
  updatedAt: "2026-09-15T09:00:00Z",
  attachments: [
    {
      id: 101,
      ticketId: 42,
      fileName: "wifi_ping_log.pdf",
      storedPath: "/uploads/wifi_ping_log.pdf",
      fileSize: 1048576,
      mimeType: "application/pdf",
      isRemoved: false,
      createdAt: "2026-09-15T08:05:00Z",
    },
  ],
};

const mockAssignees: api.StaffAssignee[] = [
  { id: 10, name: "Alex IT Staff", email: "alex.it@kmutt.ac.th", role: "IT_STAFF" },
  { id: 20, name: "Dana Admin", email: "dana.admin@kmutt.ac.th", role: "ADMINISTRATOR" },
];

const mockPublicComments: api.TicketComment[] = [
  {
    id: 1,
    ticketId: 42,
    body: "Can you confirm if this happens on 5GHz or 2.4GHz network?",
    type: "PUBLIC",
    createdAt: "2026-09-15T09:15:00Z",
    author: { id: 10, name: "Alex IT Staff", role: "IT_STAFF" },
  },
];

const mockInternalNotes: api.TicketComment[] = [
  {
    id: 101,
    ticketId: 42,
    body: "Checked access point AP-CB2-301. Firmware updated last night, might need AP restart.",
    type: "INTERNAL",
    createdAt: "2026-09-15T09:20:00Z",
    author: { id: 10, name: "Alex IT Staff", role: "IT_STAFF" },
  },
];

describe("Lab 3 — UI-04 & UI-05: StaffTicketDetail Component Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authContext, "useAuth").mockReturnValue({
      currentUser: mockStaffUser,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
    vi.spyOn(api, "getTicketDetail").mockResolvedValue(mockTicket);
    vi.spyOn(api, "getStaffAssignees").mockResolvedValue(mockAssignees);
    vi.spyOn(api, "getPublicComments").mockResolvedValue(mockPublicComments);
    vi.spyOn(api, "getInternalNotes").mockResolvedValue(mockInternalNotes);
  });

  it("renders ticket header, requester resolution banner, and core metadata", async () => {
    const handleBack = vi.fn();

    render(<StaffTicketDetail ticketId={42} onBack={handleBack} />);

    await waitFor(() => {
      expect(screen.getByTestId("detail-ticket-number")).toHaveTextContent("TKT-2026-000042");
      expect(screen.getByTestId("ticket-summary")).toHaveTextContent("Intermittent Wi-Fi disconnections in CB2 Building");
      expect(screen.getByTestId("requester-name")).toHaveTextContent("Jennifer Requester");
      expect(screen.getByTestId("ticket-category")).toHaveTextContent("Network");
      expect(screen.getByTestId("ticket-system")).toHaveTextContent("Campus Wi-Fi");
      expect(screen.getByTestId("ticket-description")).toHaveTextContent("Signal drops every 10-15 minutes on the 3rd floor.");
    });

    // Check Requester Resolution Banner (AC-07)
    expect(screen.getByTestId("requester-resolution-banner")).toBeInTheDocument();
    expect(screen.getByText(/Requester Indicated Problem is Resolved/i)).toBeInTheDocument();

    // Check Back button
    const backBtn = screen.getByTestId("back-to-queue-btn");
    await userEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it("UI-04 (AC-15): executes valid status transitions via transition matrix", async () => {
    const updateStatusSpy = vi.spyOn(api, "updateTicketStatus").mockResolvedValue({
      ...mockTicket,
      status: "In Progress",
      assignedTo: null,
      attachmentCount: 1,
    });

    render(<StaffTicketDetail ticketId={42} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("status-transition-select")).toBeInTheDocument();
    });

    // For "Open", permitted next transitions are: "In Progress", "Waiting for Requester", "Resolved", "Cancelled"
    const statusSelect = screen.getByTestId("status-transition-select");
    await userEvent.selectOptions(statusSelect, "In Progress");

    const updateBtn = screen.getByTestId("update-status-btn");
    await userEvent.click(updateBtn);

    await waitFor(() => {
      expect(updateStatusSpy).toHaveBeenCalledWith(42, "In Progress");
      expect(screen.getByTestId("status-feedback")).toHaveTextContent(/Status successfully updated to "In Progress"/i);
    });
  });

  it("UI-04 (AC-14): updates operational IT priority", async () => {
    const updatePrioritySpy = vi.spyOn(api, "updateTicketPriority").mockResolvedValue({
      ...mockTicket,
      itPriority: "URGENT",
      assignedTo: null,
      attachmentCount: 1,
    });

    render(<StaffTicketDetail ticketId={42} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("it-priority-select")).toBeInTheDocument();
    });

    const prioritySelect = screen.getByTestId("it-priority-select");
    await userEvent.selectOptions(prioritySelect, "URGENT");

    const updateBtn = screen.getByTestId("update-priority-btn");
    await userEvent.click(updateBtn);

    await waitFor(() => {
      expect(updatePrioritySpy).toHaveBeenCalledWith(42, "URGENT");
      expect(screen.getByTestId("priority-feedback")).toHaveTextContent(/IT Priority updated to "URGENT"/i);
    });
  });

  it("UI-04 (AC-13): allows claiming ticket and reassigning to staff", async () => {
    const assignSpy = vi.spyOn(api, "assignTicket").mockResolvedValue({
      ...mockTicket,
      assignedToId: 10,
      assignedTo: { id: 10, name: "Alex IT Staff", email: "alex.it@kmutt.ac.th", role: "IT_STAFF" },
      attachmentCount: 1,
    });

    render(<StaffTicketDetail ticketId={42} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("claim-btn")).toBeInTheDocument();
    });

    // Click Claim for Myself
    await userEvent.click(screen.getByTestId("claim-btn"));

    await waitFor(() => {
      expect(assignSpy).toHaveBeenCalledWith(42, 10);
      expect(screen.getByTestId("assign-feedback")).toHaveTextContent(/Ticket assigned to Alex IT Staff/i);
    });

    // Now reassign to Dana Admin (id 20)
    assignSpy.mockResolvedValueOnce({
      ...mockTicket,
      assignedToId: 20,
      assignedTo: { id: 20, name: "Dana Admin", email: "dana.admin@kmutt.ac.th", role: "ADMINISTRATOR" },
      attachmentCount: 1,
    });

    const assigneeSelect = screen.getByTestId("assignee-select");
    await userEvent.selectOptions(assigneeSelect, "20");

    await userEvent.click(screen.getByTestId("reassign-btn"));

    await waitFor(() => {
      expect(assignSpy).toHaveBeenCalledWith(42, 20);
      expect(screen.getByTestId("assign-feedback")).toHaveTextContent(/Ticket assigned to Dana Admin/i);
    });
  });

  it("UI-05 (AC-08): posts and displays public comments", async () => {
    const postCommentSpy = vi.spyOn(api, "postPublicComment").mockResolvedValue({
      id: 2,
      ticketId: 42,
      body: "We are dispatching a technician to verify the 3rd floor switch.",
      type: "PUBLIC",
      createdAt: "2026-09-15T10:00:00Z",
      author: { id: 10, name: "Alex IT Staff", role: "IT_STAFF" },
    });

    render(<StaffTicketDetail ticketId={42} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("public-comments-panel")).toBeInTheDocument();
      expect(screen.getByText("Can you confirm if this happens on 5GHz or 2.4GHz network?")).toBeInTheDocument();
    });

    const commentInput = screen.getByTestId("public-comment-input");
    await userEvent.type(commentInput, "We are dispatching a technician to verify the 3rd floor switch.");

    const submitBtn = screen.getByTestId("post-public-comment-btn");
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(postCommentSpy).toHaveBeenCalledWith(42, "We are dispatching a technician to verify the 3rd floor switch.");
      expect(screen.getByText("We are dispatching a technician to verify the 3rd floor switch.")).toBeInTheDocument();
    });
  });

  it("UI-05 (AC-10, BR-18): posts and displays internal notes with warning header", async () => {
    const postNoteSpy = vi.spyOn(api, "postInternalNote").mockResolvedValue({
      id: 102,
      ticketId: 42,
      body: "Found PoE injector overheating in IDF cabinet 3B.",
      type: "INTERNAL",
      createdAt: "2026-09-15T10:15:00Z",
      author: { id: 10, name: "Alex IT Staff", role: "IT_STAFF" },
    });

    render(<StaffTicketDetail ticketId={42} onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId("internal-notes-tab")).toBeInTheDocument();
    });

    // Switch to Internal Notes tab
    await userEvent.click(screen.getByTestId("internal-notes-tab"));

    await waitFor(() => {
      expect(screen.getByTestId("internal-notes-panel")).toBeInTheDocument();
      // Verify prominent warning header (AC-10, BR-18, UI-05)
      expect(screen.getByTestId("internal-note-warning")).toHaveTextContent(
        /Internal Note — Visible only to IT Staff and Administrators/i
      );
      expect(
        screen.getByText("Checked access point AP-CB2-301. Firmware updated last night, might need AP restart.")
      ).toBeInTheDocument();
    });

    // Add new internal note
    const noteInput = screen.getByTestId("internal-note-input");
    await userEvent.type(noteInput, "Found PoE injector overheating in IDF cabinet 3B.");

    const postNoteBtn = screen.getByTestId("post-internal-note-btn");
    await userEvent.click(postNoteBtn);

    await waitFor(() => {
      expect(postNoteSpy).toHaveBeenCalledWith(42, "Found PoE injector overheating in IDF cabinet 3B.");
      expect(screen.getByText("Found PoE injector overheating in IDF cabinet 3B.")).toBeInTheDocument();
    });
  });
});
