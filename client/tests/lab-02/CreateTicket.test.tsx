import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import CreateTicket from "../../src/components/CreateTicket.js";
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

const mockRelatedSystems: api.RelatedSystem[] = [
  { id: 1, name: "Corporate Laptop", category: "Hardware" },
  { id: 2, name: "Email", category: "Software" },
];

const mockCreatedTicket: api.Ticket = {
  id: 101,
  ticketNumber: "TKT-2026-000101",
  requesterId: 1,
  requester: mockRequester,
  categoryId: 1,
  category: { id: 1, name: "Account and Access" },
  relatedSystemId: 1,
  relatedSystem: { id: 1, name: "Corporate Laptop" },
  summary: "Cannot connect to corporate VPN network",
  description: "My VPN client fails to authenticate after the system update.",
  requestedPriority: "HIGH",
  status: "New",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  attachments: [],
};

describe("Lab 2 — CreateTicket Component", () => {
  beforeEach(() => {
    localStorage.setItem("toktickit_active_requester", JSON.stringify(mockRequester));
    vi.restoreAllMocks();
    vi.spyOn(api, "getCategories").mockResolvedValue(mockCategories);
    vi.spyOn(api, "getRelatedSystems").mockResolvedValue(mockRelatedSystems);
  });

  it("renders Create Ticket form with read-only fields, categories, and priority", async () => {
    render(
      <RequesterProvider>
        <CreateTicket />
      </RequesterProvider>
    );

    expect(screen.getByText(/Create Support Ticket/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Generated automatically upon submission/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Jennifer Anderson/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Account and Access")).toBeInTheDocument();
      expect(screen.getByText("Corporate Laptop")).toBeInTheDocument();
    });
  });

  it("shows field-level validation errors when submitted with empty or too short fields", async () => {
    render(
      <RequesterProvider>
        <CreateTicket />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Account and Access")).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /Submit Ticket/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Summary is required and must be between 5 and 100 characters/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Description is required and must be between 10 and 2000 characters/i)
      ).toBeInTheDocument();
    });
  });

  it("submits valid ticket and renders confirmation screen with official Ticket Number", async () => {
    const createSpy = vi.spyOn(api, "createTicket").mockResolvedValueOnce(mockCreatedTicket);

    render(
      <RequesterProvider>
        <CreateTicket />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Account and Access")).toBeInTheDocument();
    });

    const summaryInput = screen.getByPlaceholderText(/Brief 1-line summary/i);
    const descriptionInput = screen.getByPlaceholderText(/Provide complete details/i);
    const prioritySelect = screen.getByLabelText(/Requested Priority/i);

    await userEvent.type(summaryInput, "Cannot connect to corporate VPN network");
    await userEvent.type(
      descriptionInput,
      "My VPN client fails to authenticate after the system update."
    );
    await userEvent.selectOptions(prioritySelect, "HIGH");

    const submitBtn = screen.getByRole("button", { name: /Submit Ticket/i });
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Ticket Created Successfully!/i)).toBeInTheDocument();
      expect(screen.getByText("TKT-2026-000101")).toBeInTheDocument();
    });
  });

  it("rejects invalid file extension in attachment selection", async () => {
    render(
      <RequesterProvider>
        <CreateTicket />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Account and Access")).toBeInTheDocument();
    });

    const fileInput = document.querySelector("#file-upload-input") as HTMLInputElement;
    const invalidFile = new File(["binary content"], "malicious_script.exe", {
      type: "application/x-msdownload",
    });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(/invalid format. Only JPG, PNG, WEBP, and PDF files are allowed/i)
      ).toBeInTheDocument();
    });
  });
});
