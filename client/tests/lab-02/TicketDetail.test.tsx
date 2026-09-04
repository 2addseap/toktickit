import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RequesterProvider } from "../../src/context/RequesterContext.js";
import TicketDetail from "../../src/components/TicketDetail.js";
import * as api from "../../src/api.js";

const mockRequester: api.RequesterUser = {
  id: 1,
  name: "Jennifer Anderson",
  email: "jennifer.anderson@kmutt.ac.th",
  department: "Human Resources",
  isActive: true,
};

const mockTicketDetail: api.Ticket = {
  id: 101,
  ticketNumber: "TKT-2026-000101",
  requesterId: 1,
  requester: mockRequester,
  categoryId: 1,
  category: { id: 1, name: "Account and Access" },
  relatedSystemId: 1,
  relatedSystem: { id: 1, name: "Corporate Laptop" },
  summary: "Cannot connect to corporate VPN network",
  description: "Detailed description of the issue: VPN fails with Error 800 after OS update.",
  requestedPriority: "HIGH",
  status: "New",
  createdAt: "2026-09-05T01:00:00.000Z",
  updatedAt: "2026-09-05T01:00:00.000Z",
  attachments: [
    {
      id: 11,
      ticketId: 101,
      fileName: "error_log.pdf",
      storedPath: "/uploads/error_log.pdf",
      fileSize: 1048576,
      mimeType: "application/pdf",
      isRemoved: false,
      createdAt: "2026-09-05T01:05:00.000Z",
    },
    {
      id: 12,
      ticketId: 101,
      fileName: "old_screenshot.png",
      storedPath: "/uploads/old_screenshot.png",
      fileSize: 204800,
      mimeType: "image/png",
      isRemoved: true,
      removalReason: "File contained sensitive employee ID number.",
      removedAt: "2026-09-05T01:10:00.000Z",
      removedBy: "Jennifer Anderson",
      createdAt: "2026-09-05T01:02:00.000Z",
    },
  ],
};

describe("Lab 2 — TicketDetail Component", () => {
  beforeEach(() => {
    localStorage.setItem("toktickit_active_requester", JSON.stringify(mockRequester));
    vi.restoreAllMocks();
    vi.spyOn(api, "getTicketDetail").mockResolvedValue(mockTicketDetail);
  });

  it("renders ticket header, metadata, problem description, and attachments", async () => {
    const handleBack = vi.fn();

    render(
      <RequesterProvider>
        <TicketDetail ticketId={101} onBack={handleBack} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-000101").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Cannot connect to corporate VPN network")).toBeInTheDocument();
      expect(
        screen.getByText(/Detailed description of the issue: VPN fails with Error 800 after OS update./i)
      ).toBeInTheDocument();
      expect(screen.getByText("error_log.pdf")).toBeInTheDocument();
      expect(screen.getByText("old_screenshot.png")).toBeInTheDocument();
      expect(screen.getByText(/File contained sensitive employee ID number/i)).toBeInTheDocument();
      expect(screen.getByText(/Attachments/i)).toHaveTextContent(/Attachments \(1\/5\)/i);
    });

    const backBtn = screen.getByRole("button", { name: /Back to My Tickets/i });
    await userEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it("triggers file download when clicking download button on active attachment", async () => {
    const downloadSpy = vi.spyOn(api, "downloadAttachment").mockResolvedValue();

    render(
      <RequesterProvider>
        <TicketDetail ticketId={101} onBack={vi.fn()} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("error_log.pdf")).toBeInTheDocument();
    });

    const downloadBtn = screen.getByRole("button", { name: /Download/i });
    await userEvent.click(downloadBtn);

    expect(downloadSpy).toHaveBeenCalledWith(11, 1, "error_log.pdf");
  });

  it("opens soft-removal modal, validates reason, and submits removal", async () => {
    const removeSpy = vi.spyOn(api, "softRemoveAttachment").mockResolvedValue({
      id: 11,
      ticketId: 101,
      fileName: "error_log.pdf",
      storedPath: "/uploads/error_log.pdf",
      fileSize: 1048576,
      mimeType: "application/pdf",
      isRemoved: true,
      removalReason: "File was corrupt and incomplete.",
      removedAt: new Date().toISOString(),
      removedBy: "Jennifer Anderson",
      createdAt: "2026-09-05T01:05:00.000Z",
    });

    render(
      <RequesterProvider>
        <TicketDetail ticketId={101} onBack={vi.fn()} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("error_log.pdf")).toBeInTheDocument();
    });

    const removeBtn = screen.getByRole("button", { name: /Remove/i });
    await userEvent.click(removeBtn);

    // Modal dialog opens
    expect(screen.getByText(/Are you sure you want to remove/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /Confirm Removal/i });
    // Click with empty reason -> validation error
    await userEvent.click(confirmBtn);

    expect(
      screen.getByText(/Removal reason is required and must be at least 3 characters/i)
    ).toBeInTheDocument();

    // Type valid reason
    const reasonTextarea = screen.getByPlaceholderText(/Uploaded incorrect file/i);
    await userEvent.type(reasonTextarea, "File was corrupt and incomplete.");

    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(removeSpy).toHaveBeenCalledWith(11, "File was corrupt and incomplete.", 1);
    });
  });

  it("uploads a new attachment via file input", async () => {
    const uploadSpy = vi.spyOn(api, "uploadAttachment").mockResolvedValue({
      id: 13,
      ticketId: 101,
      fileName: "additional_system_specs.pdf",
      storedPath: "/uploads/specs.pdf",
      fileSize: 512000,
      mimeType: "application/pdf",
      isRemoved: false,
      createdAt: new Date().toISOString(),
    });

    render(
      <RequesterProvider>
        <TicketDetail ticketId={101} onBack={vi.fn()} />
      </RequesterProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText("TKT-2026-000101").length).toBeGreaterThanOrEqual(1);
    });

    const fileInput = document.querySelector("#detail-attachment-file-input") as HTMLInputElement;
    const testFile = new File(["dummy pdf content"], "additional_system_specs.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(fileInput, { target: { files: [testFile] } });

    await waitFor(() => {
      expect(uploadSpy).toHaveBeenCalledWith(101, testFile, 1);
      expect(screen.getByText("additional_system_specs.pdf")).toBeInTheDocument();
    });
  });
});
