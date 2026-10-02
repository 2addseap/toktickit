import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StaffTicketQueue from "../../src/components/StaffTicketQueue.js";
import * as api from "../../src/api.js";

const mockTickets: api.StaffTicket[] = [
  {
    id: 1,
    ticketNumber: "TKT-2026-000001",
    summary: "Cannot connect to campus VPN",
    description: "Connection times out after 30 seconds",
    requestedPriority: "HIGH",
    itPriority: "URGENT",
    status: "Open",
    resolvedIndicated: false,
    createdAt: "2026-09-10T10:00:00Z",
    updatedAt: "2026-09-10T11:00:00Z",
    requester: {
      id: 1,
      name: "Jennifer Requester",
      email: "jennifer@kmutt.ac.th",
      department: "Human Resources",
    },
    assignedTo: null, // Unassigned
    category: { id: 1, name: "Network" },
    relatedSystem: { id: 1, name: "VPN" },
    attachmentCount: 1,
  },
  {
    id: 2,
    ticketNumber: "TKT-2026-000002",
    summary: "Office 365 license expired",
    description: "Word and Excel show activation banner",
    requestedPriority: "MEDIUM",
    itPriority: "MEDIUM",
    status: "In Progress",
    resolvedIndicated: true,
    resolvedIndicatedAt: "2026-09-11T12:00:00Z",
    createdAt: "2026-09-11T09:00:00Z",
    updatedAt: "2026-09-11T14:00:00Z",
    requester: {
      id: 2,
      name: "Bob Requester",
      email: "bob@kmutt.ac.th",
      department: "Finance",
    },
    assignedTo: {
      id: 5,
      name: "Sarah IT",
      email: "sarah.it@kmutt.ac.th",
      role: "IT_STAFF",
    },
    category: { id: 2, name: "Software" },
    relatedSystem: { id: 2, name: "Office 365" },
    attachmentCount: 0,
  },
];

const mockPagination: api.PaginationMetadata = {
  page: 1,
  pageSize: 10,
  totalItems: 2,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

describe("Lab 3 — UI-03: StaffTicketQueue Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(api, "getCategories").mockResolvedValue([
      { id: 1, name: "Network" },
      { id: 2, name: "Software" },
    ]);
    vi.spyOn(api, "getStaffAssignees").mockResolvedValue([
      { id: 5, name: "Sarah IT", email: "sarah.it@kmutt.ac.th", role: "IT_STAFF" },
      { id: 6, name: "System Admin", email: "admin@kmutt.ac.th", role: "ADMINISTRATOR" },
    ]);
    vi.spyOn(api, "getStaffTickets").mockResolvedValue({
      data: mockTickets,
      pagination: mockPagination,
    });
  });

  it("renders queue title, total badge, filters bar, and ticket table", async () => {
    render(<StaffTicketQueue />);

    await waitFor(() => {
      expect(screen.getByTestId("queue-count-badge")).toHaveTextContent("2 tickets");
    });

    expect(screen.getByRole("heading", { name: /IT Staff Ticket Queue/i })).toBeInTheDocument();
    expect(screen.getByTestId("queue-search-input")).toBeInTheDocument();
    expect(screen.getByTestId("queue-status-filter")).toBeInTheDocument();
    expect(screen.getByTestId("queue-priority-filter")).toBeInTheDocument();
    expect(screen.getByTestId("queue-category-filter")).toBeInTheDocument();
    expect(screen.getByTestId("queue-assignee-filter")).toBeInTheDocument();
    expect(screen.getByTestId("toggle-unassigned-btn")).toBeInTheDocument();

    // Table elements
    expect(screen.getByTestId("queue-table")).toBeInTheDocument();
    expect(screen.getByTestId("queue-row-1")).toBeInTheDocument();
    expect(screen.getByTestId("queue-row-2")).toBeInTheDocument();

    // Verify unassigned pill on Ticket 1
    expect(screen.getByTestId("unassigned-pill")).toBeInTheDocument();
  });

  it("triggers search across ticket number and summary", async () => {
    render(<StaffTicketQueue />);

    await waitFor(() => {
      expect(screen.getByTestId("queue-count-badge")).toHaveTextContent("2 tickets");
    });

    const searchInput = screen.getByTestId("queue-search-input");
    await userEvent.type(searchInput, "VPN");

    await waitFor(() => {
      expect(api.getStaffTickets).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "VPN",
        })
      );
    });
  });

  it("toggles Unassigned Only filter button", async () => {
    render(<StaffTicketQueue />);

    await waitFor(() => {
      expect(screen.getByTestId("queue-count-badge")).toHaveTextContent("2 tickets");
    });

    const unassignedBtn = screen.getByTestId("toggle-unassigned-btn");
    await userEvent.click(unassignedBtn);

    await waitFor(() => {
      expect(api.getStaffTickets).toHaveBeenCalledWith(
        expect.objectContaining({
          assignedTo: "unassigned",
        })
      );
    });
  });

  it("filters by status and priority dropdowns", async () => {
    render(<StaffTicketQueue />);

    await waitFor(() => {
      expect(screen.getByTestId("queue-count-badge")).toHaveTextContent("2 tickets");
    });

    const statusSelect = screen.getByTestId("queue-status-filter");
    await userEvent.selectOptions(statusSelect, "Open");

    await waitFor(() => {
      expect(api.getStaffTickets).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "Open",
        })
      );
    });

    const prioritySelect = screen.getByTestId("queue-priority-filter");
    await userEvent.selectOptions(prioritySelect, "URGENT");

    await waitFor(() => {
      expect(api.getStaffTickets).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: "URGENT",
        })
      );
    });
  });

  it("calls onSelectTicket when clicking View button or row", async () => {
    const handleSelect = vi.fn();
    render(<StaffTicketQueue onSelectTicket={handleSelect} />);

    await waitFor(() => {
      expect(screen.getByTestId("view-ticket-btn-1")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId("view-ticket-btn-1"));
    expect(handleSelect).toHaveBeenCalledWith(1);
  });

  it("renders empty state when queue returns zero tickets", async () => {
    vi.spyOn(api, "getStaffTickets").mockResolvedValueOnce({
      data: [],
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });

    render(<StaffTicketQueue />);

    await waitFor(() => {
      expect(screen.getByTestId("no-tickets-message")).toBeInTheDocument();
    });
    expect(screen.getByText(/No tickets found in the queue/i)).toBeInTheDocument();
  });
});
