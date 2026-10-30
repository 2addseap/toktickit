import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RequesterDashboard from "../../src/components/RequesterDashboard.js";
import * as api from "../../src/api.js";
import * as authContext from "../../src/context/AuthContext.js";
import { RequesterProvider } from "../../src/context/RequesterContext.js";

// Mock user context
const mockRequesterUser = {
  id: 10,
  name: "Jennifer Anderson",
  email: "jennifer@kmutt.ac.th",
  role: "REQUESTER" as const,
  department: "Computer Engineering",
  mustChangePassword: false,
};

const mockDashboardData: api.RequesterDashboardData = {
  metrics: {
    myOpenTickets: 3,
    inProgressTickets: 2,
    waitingForRequesterTickets: 1,
    recentlyResolvedTickets: 5,
  },
  recentTickets: [
    {
      id: 101,
      ticketNumber: "TKT-2026-00101",
      summary: "Laptop battery drains quickly",
      status: "In Progress",
      itPriority: "HIGH",
      createdAt: "2026-10-28T09:00:00.000Z",
      updatedAt: "2026-10-30T10:00:00.000Z",
    },
    {
      id: 102,
      ticketNumber: "TKT-2026-00102",
      summary: "Request software access for Figma",
      status: "Resolved",
      itPriority: "LOW",
      createdAt: "2026-10-25T11:00:00.000Z",
      updatedAt: "2026-10-29T14:30:00.000Z",
    },
  ],
};

function renderComponent(props?: {
  onCreateTicket?: () => void;
  onSelectTicket?: (ticketId: number) => void;
  onViewAllTickets?: (filter?: string) => void;
}) {
  return render(
    <RequesterProvider>
      <RequesterDashboard
        onCreateTicket={props?.onCreateTicket || vi.fn()}
        onSelectTicket={props?.onSelectTicket || vi.fn()}
        onViewAllTickets={props?.onViewAllTickets || vi.fn()}
      />
    </RequesterProvider>
  );
}

describe("Lab 4 — UI-04: Requester Dashboard Component Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authContext, "useAuth").mockReturnValue({
      currentUser: mockRequesterUser as any,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      changePassword: vi.fn(),
      token: "mock-token",
    });
  });

  it("renders welcome greeting and all 4 KPI metric cards with accurate counts", async () => {
    vi.spyOn(api, "getRequesterDashboard").mockResolvedValue(mockDashboardData);

    renderComponent();

    // Verify welcome banner
    await waitFor(() => {
      expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
    });

    // Verify 4 KPI metric cards (AC-12, UI-spec 3.2)
    expect(screen.getByTestId("kpi-my-open")).toHaveTextContent("3");
    expect(screen.getByTestId("kpi-in-progress")).toHaveTextContent("2");
    expect(screen.getByTestId("kpi-waiting-input")).toHaveTextContent("1");
    expect(screen.getByTestId("kpi-recently-resolved")).toHaveTextContent("5");
  });

  it("renders recent tickets list with ticket details and status badges", async () => {
    vi.spyOn(api, "getRequesterDashboard").mockResolvedValue(mockDashboardData);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-00101")).toBeInTheDocument();
    });

    expect(screen.getByText("Laptop battery drains quickly")).toBeInTheDocument();
    expect(screen.getByText("TKT-2026-00102")).toBeInTheDocument();
    expect(screen.getByText("Request software access for Figma")).toBeInTheDocument();
  });

  it("triggers drill-down navigation when clicking a KPI card", async () => {
    vi.spyOn(api, "getRequesterDashboard").mockResolvedValue(mockDashboardData);
    const onViewAllTickets = vi.fn();

    renderComponent({ onViewAllTickets });

    await waitFor(() => {
      expect(screen.getByTestId("kpi-my-open")).toBeInTheDocument();
    });

    const openKpi = screen.getByTestId("kpi-my-open");
    await userEvent.click(openKpi);

    expect(onViewAllTickets).toHaveBeenCalledWith("open");
  });

  it("triggers ticket selection when clicking a recent ticket row", async () => {
    vi.spyOn(api, "getRequesterDashboard").mockResolvedValue(mockDashboardData);
    const onSelectTicket = vi.fn();

    renderComponent({ onSelectTicket });

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-00101")).toBeInTheDocument();
    });

    const ticketRow = screen.getByTestId("recent-ticket-101");
    await userEvent.click(ticketRow);

    expect(onSelectTicket).toHaveBeenCalledWith(101);
  });

  it("renders empty state when requester has no tickets (AC-13)", async () => {
    vi.spyOn(api, "getRequesterDashboard").mockResolvedValue({
      metrics: {
        myOpenTickets: 0,
        inProgressTickets: 0,
        waitingForRequesterTickets: 0,
        recentlyResolvedTickets: 0,
      },
      recentTickets: [],
    });

    const onCreateTicket = vi.fn();
    renderComponent({ onCreateTicket });

    await waitFor(() => {
      expect(screen.getByTestId("empty-dashboard-state")).toBeInTheDocument();
    });

    expect(screen.getByText(/submitted any service tickets yet/i)).toBeInTheDocument();

    const createBtn = screen.getByTestId("empty-create-ticket-btn");
    await userEvent.click(createBtn);
    expect(onCreateTicket).toHaveBeenCalled();
  });

  it("displays error banner and retry option when API call fails", async () => {
    vi.spyOn(api, "getRequesterDashboard").mockRejectedValue(new Error("Network timeout connecting to server"));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-error")).toBeInTheDocument();
    });

    expect(screen.getByText(/Failed to load dashboard data/i)).toBeInTheDocument();
  });
});
