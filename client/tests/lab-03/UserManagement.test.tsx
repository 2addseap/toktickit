import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserManagement from "../../src/components/UserManagement.js";
import { AuthProvider } from "../../src/context/AuthContext.js";
import * as api from "../../src/api.js";

const mockAdminUser: api.User = {
  id: 1,
  name: "System Admin",
  email: "admin@kmutt.ac.th",
  role: "ADMINISTRATOR",
  department: "IT Services",
  isActive: true,
  mustChangePassword: false,
};

const mockStaffUser: api.User = {
  id: 2,
  name: "Sarah IT",
  email: "sarah.it@kmutt.ac.th",
  role: "IT_STAFF",
  department: "Infrastructure",
  isActive: true,
  mustChangePassword: false,
};

const mockRequesterUser: api.User = {
  id: 3,
  name: "Jennifer Requester",
  email: "jennifer@kmutt.ac.th",
  role: "REQUESTER",
  department: "Human Resources",
  isActive: false,
  mustChangePassword: false,
};

describe("Lab 3 — UI-06: Administrator User Management Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Mock getMe to return mockAdminUser so AuthContext logs in as admin
    vi.spyOn(api, "getToken").mockReturnValue("mock-token-admin");
    vi.spyOn(api, "getMe").mockResolvedValue(mockAdminUser);
    vi.spyOn(api, "getAdminUsers").mockResolvedValue([
      mockAdminUser,
      mockStaffUser,
      mockRequesterUser,
    ]);
  });

  it("renders user directory table, count badge, search bar, and filter controls", async () => {
    render(
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    );

    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByTestId("user-count-badge")).toHaveTextContent("3 users");
    });

    expect(screen.getByRole("heading", { name: /User Management/i })).toBeInTheDocument();
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
    expect(screen.getByTestId("role-filter")).toBeInTheDocument();
    expect(screen.getByTestId("add-user-btn")).toBeInTheDocument();

    // Check rows rendered
    expect(screen.getByTestId(`user-row-${mockAdminUser.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`user-row-${mockStaffUser.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`user-row-${mockRequesterUser.id}`)).toBeInTheDocument();
  });

  it("triggers search and filters when typing in search input or changing role", async () => {
    render(
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-count-badge")).toHaveTextContent("3 users");
    });

    const searchInput = screen.getByTestId("search-input");
    await userEvent.type(searchInput, "Sarah");

    await waitFor(() => {
      expect(api.getAdminUsers).toHaveBeenCalledWith("Sarah", "");
    });

    const roleSelect = screen.getByTestId("role-filter");
    await userEvent.selectOptions(roleSelect, "IT_STAFF");

    await waitFor(() => {
      expect(api.getAdminUsers).toHaveBeenCalledWith("Sarah", "IT_STAFF");
    });
  });

  it("displays empty state when directory query yields zero results", async () => {
    vi.spyOn(api, "getAdminUsers").mockResolvedValueOnce([]);

    render(
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("no-users-message")).toBeInTheDocument();
    });
    expect(screen.getByText(/No users found/i)).toBeInTheDocument();
  });

  it("opens Add User modal, validates required fields, and calls createAdminUser", async () => {
    const mockCreate = vi.spyOn(api, "createAdminUser").mockResolvedValueOnce({
      id: 4,
      name: "New Member",
      email: "new.member@kmutt.ac.th",
      role: "IT_STAFF",
      department: "Network",
      isActive: true,
      mustChangePassword: true,
    });

    render(
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("add-user-btn")).toBeInTheDocument();
    });

    // Open Modal
    await userEvent.click(screen.getByTestId("add-user-btn"));
    expect(screen.getByTestId("add-user-modal")).toBeInTheDocument();

    // Submit without input -> shows validation errors
    const submitBtn = screen.getByTestId("submit-add-user-btn");
    await userEvent.click(submitBtn);

    expect(screen.getByText(/Full name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Email address is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Initial password is required/i)).toBeInTheDocument();

    // Fill valid data
    await userEvent.type(screen.getByTestId("add-name-input"), "New Member");
    await userEvent.type(screen.getByTestId("add-email-input"), "new.member@kmutt.ac.th");
    await userEvent.selectOptions(screen.getByTestId("add-role-select"), "IT_STAFF");
    await userEvent.type(screen.getByTestId("add-dept-input"), "Network");
    await userEvent.type(screen.getByTestId("add-password-input"), "Password123!");

    // Submit form
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        name: "New Member",
        email: "new.member@kmutt.ac.th",
        role: "IT_STAFF",
        department: "Network",
        isActive: true,
        initialPassword: "Password123!",
      });
    });
  });

  it("enforces self-deactivation guardrail when logged-in administrator edits own account", async () => {
    render(
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId(`edit-user-btn-${mockAdminUser.id}`)).toBeInTheDocument();
    });

    // Click Edit on mockAdminUser (logged in admin)
    await userEvent.click(screen.getByTestId(`edit-user-btn-${mockAdminUser.id}`));

    expect(screen.getByTestId("edit-user-modal")).toBeInTheDocument();

    // Active switch must be disabled
    const activeSwitch = screen.getByTestId("edit-isactive-switch");
    expect(activeSwitch).toBeDisabled();
    expect(screen.getByTestId("self-deactivation-notice")).toHaveTextContent(
      /You cannot deactivate your own account/i
    );
  });

  it("enforces last active administrator protection guardrail", async () => {
    // Single admin in list
    vi.spyOn(api, "getAdminUsers").mockResolvedValue([
      mockAdminUser, // Only active administrator
      mockStaffUser,
    ]);

    render(
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId(`edit-user-btn-${mockAdminUser.id}`)).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId(`edit-user-btn-${mockAdminUser.id}`));

    expect(screen.getByTestId("last-admin-warning")).toBeInTheDocument();

    // Role selector must be disabled to prevent demotion
    const roleSelect = screen.getByTestId("edit-role-select");
    expect(roleSelect).toBeDisabled();
  });

  it("allows updating another user and resetting their initial password", async () => {
    const mockUpdate = vi.spyOn(api, "updateAdminUser").mockResolvedValueOnce({
      ...mockStaffUser,
      name: "Sarah IT Updated",
    });

    const mockReset = vi.spyOn(api, "resetAdminUserPassword").mockResolvedValueOnce({
      message: "Initial password reset successfully.",
    });

    render(
      <AuthProvider>
        <UserManagement />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId(`edit-user-btn-${mockStaffUser.id}`)).toBeInTheDocument();
    });

    // Open Edit modal for staff user
    await userEvent.click(screen.getByTestId(`edit-user-btn-${mockStaffUser.id}`));
    expect(screen.getByTestId("edit-user-modal")).toBeInTheDocument();

    // Active switch should NOT be disabled for staff user
    const activeSwitch = screen.getByTestId("edit-isactive-switch");
    expect(activeSwitch).not.toBeDisabled();

    // Test Reset Password section
    const resetInput = screen.getByTestId("reset-password-input");
    const resetBtn = screen.getByTestId("reset-password-btn");

    await userEvent.type(resetInput, "NewTempPassword123!");
    await userEvent.click(resetBtn);

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith(mockStaffUser.id, "NewTempPassword123!");
      expect(screen.getByTestId("reset-success-alert")).toHaveTextContent(
        /Password reset successfully/i
      );
    });

    // Update user name and submit
    const nameInput = screen.getByTestId("edit-name-input");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Sarah IT Updated");

    const submitBtn = screen.getByTestId("submit-edit-user-btn");
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(mockStaffUser.id, {
        name: "Sarah IT Updated",
        email: mockStaffUser.email,
        role: "IT_STAFF",
        department: mockStaffUser.department,
        isActive: true,
      });
    });
  });
});
