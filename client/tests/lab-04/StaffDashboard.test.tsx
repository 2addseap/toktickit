import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StaffDashboard from "../../src/components/StaffDashboard.js";
import * as api from "../../src/api.js";
import * as authContext from "../../src/context/AuthContext.js";

const mockStaffUser = {
  id: 20,
  name: "Michael Staff",
  email: "michael@kmutt.ac.th",
  role: "IT_STAFF" as const,
  mustChangePassword: false,
};

const mockAdminUser = {
  id: 1,
  name: "Admin User",
  email: "admin@kmutt.ac.th",
  role: "ADMINISTRATOR" as const,
  mustChangePassword: false,
};

const mockStaffDashboardData: api.StaffDashboardData = {
  metrics: {
    unassignedTickets: 6,
    myAssignedTickets: 4,
    newTickets: 14,
    openTickets: 23,
    inProgressTickets: 18,
    waitingRequesterTickets: 7,
    urgentTickets: 3,
  },
  recentUrgentTickets: [
    {
      id: 201,
      ticketNumber: "TKT-2026-00201",
      summary: "Core ERP Database connection latency high",
      status: "In Progress",
      itPriority: "URGENT",
      assignedTo: { id: 20, name: "Michael Staff" },
      requester: { id: 10, name: "Jennifer Anderson" },
      updatedAt: "2026-10-30T09:45:00.000Z",
    },
    {
      id: 202,
      ticketNumber: "TKT-2026-00202",
      summary: "Production mail server unreachable",
      status: "Open",
      itPriority: "URGENT",
      assignedTo: null,
      requester: { id: 11, name: "Somchai Requester" },
      updatedAt: "2026-10-30T10:15:00.000Z",
    },
  ],
};

const mockAdminDashboardData: api.StaffDashboardData = {
  ...mockStaffDashboardData,
  metrics: {
    ...mockStaffDashboardData.metrics,
    adminUserStats: {
      totalUsers: 45,
      activeUsers: 42,
      inactiveUsers: 3,
    },
  },
};

function renderComponent(props?: {
  onSelectTicket?: (ticketId: number) => void;
  onNavigateToQueue?: (filter?: { status?: string; assignedTo?: string; itPriority?: string }) => void;
  onCreateTicket?: () => void;
  onNavigateToUserManagement?: () => void;
}) {
  return render(
    <StaffDashboard
      onSelectTicket={props?.onSelectTicket || vi.fn()}
      onNavigateToQueue={props?.onNavigateToQueue || vi.fn()}
      onCreateTicket={props?.onCreateTicket || vi.fn()}
      onNavigateToUserManagement={props?.onNavigateToUserManagement || vi.fn()}
    />
  );
}

describe("Lab 4 — UI-05: IT Staff & Administrator Dashboard Component Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders welcome banner and operational metric cards for IT Staff (AC-14)", async () => {
    vi.spyOn(authContext, "useAuth").mockReturnValue({
      currentUser: mockStaffUser as any,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      changePassword: vi.fn(),
      token: "mock-token",
    });
    vi.spyOn(api, "getStaffDashboard").mockResolvedValue(mockStaffDashboardData);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    });

    expect(screen.getByTestId("kpi-new")).toHaveTextContent("14");
    expect(screen.getByTestId("kpi-open")).toHaveTextContent("23");
    expect(screen.getByTestId("kpi-in-progress")).toHaveTextContent("18");
    expect(screen.getByTestId("kpi-waiting")).toHaveTextContent("7");
    expect(screen.getByTestId("kpi-my-assigned")).toHaveTextContent("4");
    expect(screen.getByTestId("kpi-unassigned")).toHaveTextContent("6");
    expect(screen.getByTestId("kpi-urgent")).toHaveTextContent("3");

    // Standard IT staff should NOT see the admin user directory card
    expect(screen.queryByTestId("admin-user-stats-card")).not.toBeInTheDocument();
  });

  it("renders Admin user stats card when authenticated user is Administrator (AC-16)", async () => {
    vi.spyOn(authContext, "useAuth").mockReturnValue({
      currentUser: mockAdminUser as any,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      changePassword: vi.fn(),
      token: "mock-token",
    });
    vi.spyOn(api, "getStaffDashboard").mockResolvedValue(mockAdminDashboardData);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("admin-user-stats-card")).toBeInTheDocument();
    });

    expect(screen.getByText("45")).toBeInTheDocument(); // totalUsers
    expect(screen.getByText(/42 active/i)).toBeInTheDocument();
  });

  it("triggers drill-down to queue when clicking a metric card (AC-17)", async () => {
    vi.spyOn(authContext, "useAuth").mockReturnValue({
      currentUser: mockStaffUser as any,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      changePassword: vi.fn(),
      token: "mock-token",
    });
    vi.spyOn(api, "getStaffDashboard").mockResolvedValue(mockStaffDashboardData);

    const onNavigateToQueue = vi.fn();
    renderComponent({ onNavigateToQueue });

    await waitFor(() => {
      expect(screen.getByTestId("kpi-unassigned")).toBeInTheDocument();
    });

    // Click Unassigned card
    await userEvent.click(screen.getByTestId("kpi-unassigned"));
    expect(onNavigateToQueue).toHaveBeenCalledWith({ assignedTo: "unassigned" });

    // Click My Assigned card
    await userEvent.click(screen.getByTestId("kpi-my-assigned"));
    expect(onNavigateToQueue).toHaveBeenCalledWith({ assignedTo: "me" });

    // Click Urgent card
    await userEvent.click(screen.getByTestId("kpi-urgent"));
    expect(onNavigateToQueue).toHaveBeenCalledWith({ itPriority: "URGENT" });
  });

  it("renders urgent tickets list and allows selecting a ticket to open", async () => {
    vi.spyOn(authContext, "useAuth").mockReturnValue({
      currentUser: mockStaffUser as any,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      changePassword: vi.fn(),
      token: "mock-token",
    });
    vi.spyOn(api, "getStaffDashboard").mockResolvedValue(mockStaffDashboardData);

    const onSelectTicket = vi.fn();
    renderComponent({ onSelectTicket });

    await waitFor(() => {
      expect(screen.getByText("TKT-2026-00201")).toBeInTheDocument();
    });

    expect(screen.getByText("Core ERP Database connection latency high")).toBeInTheDocument();
    expect(screen.getByText("TKT-2026-00202")).toBeInTheDocument();

    const viewBtn = screen.getByTestId("view-urgent-ticket-201");
    await userEvent.click(viewBtn);

    expect(onSelectTicket).toHaveBeenCalledWith(201);
  });

  it("renders empty state when there are zero urgent tickets", async () => {
    vi.spyOn(authContext, "useAuth").mockReturnValue({
      currentUser: mockStaffUser as any,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      changePassword: vi.fn(),
      token: "mock-token",
    });
    vi.spyOn(api, "getStaffDashboard").mockResolvedValue({
      ...mockStaffDashboardData,
      metrics: {
        ...mockStaffDashboardData.metrics,
        urgentTickets: 0,
      },
      recentUrgentTickets: [],
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("empty-urgent-state")).toBeInTheDocument();
    });

    expect(screen.getByText(/No urgent tickets/i)).toBeInTheDocument();
  });
});
