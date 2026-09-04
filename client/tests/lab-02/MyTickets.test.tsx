import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import MyTickets from "../../src/components/MyTickets.js";
import * as api from "../../src/api.js";

const mockRequester: api.RequesterUser = {
  id: 1,
  name: "Jennifer Anderson",
  email: "jennifer.anderson@kmutt.ac.th",
  department: "Human Resources",
  isActive: true,
};

const mockCategories: api.Category[] = [
  { id: 1, name: "Account and Access" },
  { id: 2, name: "Hardware" },
];

const mockTicketsResponse: api.PaginatedTickets = {
  data: [
    {
      id: 1,
      ticketNumber: "TKT-2026-000001",
      requesterId: 1,
      categoryId: 1,
      category: { id: 1, name: "Account and Access" },
      relatedSystemId: 1,
      summary: "Cannot access internal HR portal",
      description: "Getting HTTP 403 when trying to access HR payroll module.",
      requestedPriority: "HIGH",
      status: "New",
      createdAt: "2026-09-05T01:00:00.000Z",
      updatedAt: "2026-09-05T01:00:00.000Z",
      attachmentCount: 2,
    },
    {
      id: 2,
      ticketNumber: "TKT-2026-000002",
      requesterId: 1,
      categoryId: 2,
      category: { id: 2, name: "Hardware" },
      relatedSystemId: 2,
      summary: "Keyboard broken on corporate laptop",
      description: "Spacebar key is physically stuck and unresponsive.",
      requestedPriority: "LOW",
      status: "In Progress",
      createdAt: "2026-09-04T10:00:00.000Z",
      updatedAt: "2026-09-04T12:00:00.000Z",
      attachmentCount: 0,
    },
  ],
  pagination: {
    page: 1,
    pageSize: 10,
    totalItems: 2,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

describe("Lab 2 — MyTickets Component", () => {
  beforeEach(() => {
    localStorage.setItem("toktickit_active_requester", JSON.stringify(mockRequester));
    vi.restoreAllMocks();
    vi.spyOn(api, "getCategories").mockResolvedValue(mockCategories);
    vi.spyOn(api, "getTickets").mockResolvedValue(mockTicketsResponse);
  });

  it("renders ticket list, filters, desktop table and mobile cards", async () => {
    render(
      <RequesterProvider>
        <MyTickets />
      </RequesterProvider>
    );

    expect(screen.getByText("My Tickets")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search by Ticket # or Summary/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-000001").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Cannot access internal HR portal").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("TKT-2026-000002").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Keyboard broken on corporate laptop").length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText(/Showing/i)).toHaveTextContent(/Showing 1 to 2 of 2 tickets/i);
  });

  it("triggers search and calls getTickets with search term", async () => {
    const getTicketsSpy = vi.spyOn(api, "getTickets").mockResolvedValue(mockTicketsResponse);

    render(
      <RequesterProvider>
        <MyTickets />
      </RequesterProvider>
    );

    const searchInput = screen.getByPlaceholderText(/Search by Ticket # or Summary/i);
    await userEvent.type(searchInput, "portal");

    await waitFor(
      () => {
        expect(getTicketsSpy).toHaveBeenCalledWith(
          expect.objectContaining({ search: "portal" }),
          1
        );
      },
      { timeout: 1500 }
    );
  });

  it("filters by category and priority", async () => {
    const getTicketsSpy = vi.spyOn(api, "getTickets").mockResolvedValue(mockTicketsResponse);

    render(
      <RequesterProvider>
        <MyTickets />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-000001").length).toBeGreaterThanOrEqual(1);
    });

    const prioritySelect = screen.getByLabelText(/Filter by Priority/i);
    await userEvent.selectOptions(prioritySelect, "HIGH");

    await waitFor(() => {
      expect(getTicketsSpy).toHaveBeenCalledWith(
        expect.objectContaining({ priority: "HIGH" }),
        1
      );
    });
  });

  it("displays empty state when requester has no tickets", async () => {
    vi.spyOn(api, "getTickets").mockResolvedValueOnce({
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

    render(
      <RequesterProvider>
        <MyTickets />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/You haven't submitted any IT tickets yet/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Create Your First Ticket/i })).toBeInTheDocument();
    });
  });

  it("displays no results state and allows clearing filters when filter yields 0 tickets", async () => {
    let mockResult = mockTicketsResponse;
    vi.spyOn(api, "getTickets").mockImplementation(async () => mockResult);

    render(
      <RequesterProvider>
        <MyTickets />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-000001").length).toBeGreaterThanOrEqual(1);
    });

    // Update mock for subsequent search
    mockResult = {
      data: [],
      pagination: {
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };

    const searchInput = screen.getByPlaceholderText(/Search by Ticket # or Summary/i);
    await userEvent.type(searchInput, "nonexistent");

    await waitFor(
      () => {
        expect(screen.getByText(/No tickets match your search filters/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Mock returns tickets again when filters cleared
    mockResult = mockTicketsResponse;
    const clearBtn = screen.getByRole("button", { name: /Clear All Filters/i });
    await userEvent.click(clearBtn);

    expect(searchInput).toHaveValue("");
  });
});
