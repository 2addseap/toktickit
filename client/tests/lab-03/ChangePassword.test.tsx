import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChangePassword from "../../src/components/ChangePassword.js";
import { AuthProvider } from "../../src/context/AuthContext.js";
import * as api from "../../src/api.js";

describe("Lab 3 — UI-02: ChangePassword Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders the password change form and complexity checklist", () => {
    render(
      <AuthProvider>
        <ChangePassword />
      </AuthProvider>
    );

    expect(screen.getByRole("heading", { name: /Change Your Password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Current \(Temporary\) Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^New Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm New Password/i)).toBeInTheDocument();
    expect(screen.getByText(/Be at least 8 characters in length/i)).toBeInTheDocument();
    expect(screen.getByText(/Include uppercase and lowercase letters/i)).toBeInTheDocument();
  });

  it("keeps submit button disabled while password rules are incomplete", () => {
    render(
      <AuthProvider>
        <ChangePassword />
      </AuthProvider>
    );

    const submitBtn = screen.getByRole("button", { name: /Save New Password/i });
    expect(submitBtn).toBeDisabled();
  });

  it("enables submit button only when all complexity rules and match criteria are satisfied", async () => {
    render(
      <AuthProvider>
        <ChangePassword />
      </AuthProvider>
    );

    const currentInput = screen.getByLabelText(/Current \(Temporary\) Password/i);
    const newInput = screen.getByLabelText(/^New Password/i);
    const confirmInput = screen.getByLabelText(/Confirm New Password/i);
    const submitBtn = screen.getByRole("button", { name: /Save New Password/i });

    // Enter current temporary password
    await userEvent.type(currentInput, "Password123!");

    // Enter weak password
    await userEvent.type(newInput, "weak");
    await userEvent.type(confirmInput, "weak");
    expect(submitBtn).toBeDisabled();

    // Clear and enter valid complex password
    await userEvent.clear(newInput);
    await userEvent.clear(confirmInput);
    await userEvent.type(newInput, "NewSecurePassword2026!");
    await userEvent.type(confirmInput, "NewSecurePassword2026!");

    expect(submitBtn).not.toBeDisabled();
  });

  it("calls changePassword API on submit with valid entries", async () => {
    const mockChangePassword = vi.spyOn(api, "changePassword").mockResolvedValueOnce({
      message: "Password updated successfully.",
      user: {
        id: 1,
        name: "Jennifer",
        email: "jennifer@kmutt.ac.th",
        role: "REQUESTER",
        mustChangePassword: false,
      },
    });

    render(
      <AuthProvider>
        <ChangePassword />
      </AuthProvider>
    );

    const currentInput = screen.getByLabelText(/Current \(Temporary\) Password/i);
    const newInput = screen.getByLabelText(/^New Password/i);
    const confirmInput = screen.getByLabelText(/Confirm New Password/i);
    const submitBtn = screen.getByRole("button", { name: /Save New Password/i });

    await userEvent.type(currentInput, "Password123!");
    await userEvent.type(newInput, "NewSecurePassword2026!");
    await userEvent.type(confirmInput, "NewSecurePassword2026!");
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith(
        "Password123!",
        "NewSecurePassword2026!",
        "NewSecurePassword2026!"
      );
    });
  });
});
