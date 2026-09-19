import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "../../src/components/Login.js";
import { AuthProvider } from "../../src/context/AuthContext.js";
import * as api from "../../src/api.js";

describe("Lab 3 — UI-01: Login Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders the login form elements correctly", () => {
    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    expect(screen.getByRole("heading", { name: /Sign in to TokTickIT/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
  });

  it("displays validation error when submitting with empty email", async () => {
    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    const submitBtn = screen.getByRole("button", { name: /Sign In/i });
    await userEvent.click(submitBtn);

    expect(screen.getByRole("alert")).toHaveTextContent("Email address is required.");
  });

  it("displays validation error when submitting with empty password", async () => {
    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/Email Address/i);
    await userEvent.type(emailInput, "test@kmutt.ac.th");

    const submitBtn = screen.getByRole("button", { name: /Sign In/i });
    await userEvent.click(submitBtn);

    expect(screen.getByRole("alert")).toHaveTextContent("Password is required.");
  });

  it("displays error message from API on failed authentication", async () => {
    vi.spyOn(api, "login").mockRejectedValueOnce(new Error("Invalid email or password."));

    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/^Password/i);
    const submitBtn = screen.getByRole("button", { name: /Sign In/i });

    await userEvent.type(emailInput, "user@kmutt.ac.th");
    await userEvent.type(passwordInput, "WrongPassword");
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid email or password.");
    });
  });

  it("toggles password visibility when clicking eye button", async () => {
    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    const passwordInput = screen.getByLabelText(/^Password/i);
    expect(passwordInput).toHaveAttribute("type", "password");

    const toggleBtn = screen.getByLabelText(/Show password/i);
    await userEvent.click(toggleBtn);

    expect(passwordInput).toHaveAttribute("type", "text");
  });
});
