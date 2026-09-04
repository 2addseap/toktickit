import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import RequesterSelect from "../../src/components/RequesterSelect.js";
import * as api from "../../src/api.js";

const mockRequesters: api.RequesterUser[] = [
  {
    id: 1,
    name: "Jennifer Anderson",
    email: "jennifer.anderson@kmutt.ac.th",
    department: "Human Resources",
    isActive: true,
  },
  {
    id: 2,
    name: "Michael Brown",
    email: "michael.brown@kmutt.ac.th",
    department: "Finance",
    isActive: true,
  },
];

describe("Lab 2 — RequesterSelect Component", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders the selection card, title, and testing notice banner", async () => {
    vi.spyOn(api, "getRequesters").mockResolvedValueOnce(mockRequesters);

    render(
      <RequesterProvider>
        <RequesterSelect />
      </RequesterProvider>
    );

    expect(screen.getByText(/Select Development Requester/i)).toBeInTheDocument();
    expect(screen.getByText(/Testing Notice/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });

  it("populates active development requesters in dropdown and enables Continue button", async () => {
    vi.spyOn(api, "getRequesters").mockResolvedValueOnce(mockRequesters);

    render(
      <RequesterProvider>
        <RequesterSelect />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Jennifer Anderson/i)).toBeInTheDocument();
      expect(screen.getByText(/Michael Brown/i)).toBeInTheDocument();
    });

    const continueBtn = screen.getByRole("button", { name: /Continue/i });
    expect(continueBtn).not.toBeDisabled();

    // Select second requester
    const select = screen.getByRole("combobox");
    await userEvent.selectOptions(select, "2");

    await userEvent.click(continueBtn);

    // Verify localStorage was updated
    expect(localStorage.getItem("toktickit_active_requester")).toContain("Michael Brown");
  });

  it("displays error alert with retry button on API failure", async () => {
    vi.spyOn(api, "getRequesters").mockRejectedValueOnce(
      new Error("Network connection lost")
    );

    render(
      <RequesterProvider>
        <RequesterSelect />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Unable to load requesters/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
    });
  });
});
