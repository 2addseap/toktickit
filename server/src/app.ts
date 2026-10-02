import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { Prisma } from "@prisma/client";
import { getPrisma } from "./prisma.js";
import { upload, generateTicketNumber } from "./upload.js";
import {
  hashPassword,
  comparePassword,
  validatePasswordComplexity,
  generateToken,
  authenticate,
  requireRole,
} from "./auth.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// Lab 1 Routes
// ---------------------------------------------------------------------------
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const categories = await getPrisma().category.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    });
    res.status(200).json(categories);
  } catch {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// ---------------------------------------------------------------------------
// Lab 3 — Issue 2: Authentication & Identity Endpoints
// ---------------------------------------------------------------------------

// 1. Authenticate User (Login)
app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        error: "Validation Failed",
        message: "Email and password are required.",
      });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const user = await getPrisma().user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid email or password.",
      });
    }

    const isValidPassword = await comparePassword(String(password), user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid email or password.",
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    });

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Failed to authenticate." });
  }
});

// 2. Terminate Session (Logout)
app.post("/api/auth/logout", (_req: Request, res: Response) => {
  res.status(200).json({ message: "Logged out successfully." });
});

// 3. Retrieve Current Authenticated User Profile
app.get("/api/auth/me", authenticate, (req: Request, res: Response) => {
  res.status(200).json(req.user);
});

// 4. Change Password (Mandatory or Voluntary)
app.post("/api/auth/change-password", authenticate, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user!.id;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: "Validation Failed",
        message: "Current password, new password, and confirmation are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: "Validation Failed",
        message: "New password and confirmation do not match.",
      });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({
        error: "Validation Failed",
        message: "New password must be different from current password.",
      });
    }

    const complexity = validatePasswordComplexity(newPassword);
    if (!complexity.valid) {
      return res.status(400).json({
        error: "Validation Failed",
        message: complexity.errors[0],
        fieldErrors: { newPassword: complexity.errors[0] },
      });
    }

    const user = await getPrisma().user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const isCurrentValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return res.status(400).json({
        error: "Validation Failed",
        message: "Current password is incorrect.",
        fieldErrors: { currentPassword: "Current password is incorrect." },
      });
    }

    const newHash = await hashPassword(newPassword);
    const updatedUser = await getPrisma().user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        mustChangePassword: true,
      },
    });

    res.status(200).json({
      message: "Password updated successfully.",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Failed to update password." });
  }
});

// ---------------------------------------------------------------------------
// Lab 2 — Issue 2: Development Requester Context & Reference Data Endpoints
// ---------------------------------------------------------------------------

// 1. Get Active Development Requesters
app.get("/api/requesters", async (_req: Request, res: Response) => {
  try {
    const requesters = await getPrisma().user.findMany({
      where: { role: "REQUESTER", isActive: true },
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        isActive: true,
      },
    });
    res.status(200).json(requesters);
  } catch {
    res.status(500).json({ error: "Failed to fetch active development requesters" });
  }
});

// 2. Get Active Related Systems
app.get("/api/related-systems", async (_req: Request, res: Response) => {
  try {
    const systems = await getPrisma().relatedSystem.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        category: true,
      },
    });
    res.status(200).json(systems);
  } catch {
    res.status(500).json({ error: "Failed to fetch related systems" });
  }
});

// ---------------------------------------------------------------------------
// Lab 2 — Issue 3: Create Ticket Endpoint
// ---------------------------------------------------------------------------

const ALLOWED_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

// Middleware for multipart upload with graceful error handling
const handleUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.array("attachments", 5)(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: "File Too Large",
            message: "Each attachment must be 5 MB or less.",
          });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({
            error: "Too Many Files",
            message: "Maximum 5 attachments are allowed per ticket.",
          });
        }
      }
      return res.status(400).json({
        error: "Invalid Attachment",
        message: err instanceof Error ? err.message : "Failed to process attachment upload",
      });
    }
    next();
  });
};

app.post("/api/tickets", handleUpload, async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const rawRequesterId = req.headers["x-requester-id"] ?? req.body.requesterId;
    const requesterId = Number(rawRequesterId);

    const { categoryId, relatedSystemId, summary, description, requestedPriority } = req.body;
    const fieldErrors: Record<string, string> = {};

    // 1. Validate Requester
    if (!requesterId || isNaN(requesterId)) {
      fieldErrors.requesterId = "Active development requester is required.";
    } else {
      const requester = await prisma.user.findUnique({
        where: { id: requesterId },
      });
      if (!requester || !requester.isActive) {
        fieldErrors.requesterId = "Selected requester is invalid or inactive.";
      }
    }

    // 2. Validate Category
    if (!categoryId || isNaN(Number(categoryId))) {
      fieldErrors.categoryId = "Category is required.";
    } else {
      const catExists = await prisma.category.findUnique({
        where: { id: Number(categoryId) },
      });
      if (!catExists) {
        fieldErrors.categoryId = "Selected category does not exist.";
      }
    }

    // 3. Validate Related System
    if (!relatedSystemId || isNaN(Number(relatedSystemId))) {
      fieldErrors.relatedSystemId = "Related system is required.";
    } else {
      const sysExists = await prisma.relatedSystem.findUnique({
        where: { id: Number(relatedSystemId) },
      });
      if (!sysExists) {
        fieldErrors.relatedSystemId = "Selected related system does not exist.";
      }
    }

    // 4. Validate Summary (5 - 100 characters trimmed)
    const trimmedSummary = typeof summary === "string" ? summary.trim() : "";
    if (!trimmedSummary || trimmedSummary.length < 5 || trimmedSummary.length > 100) {
      fieldErrors.summary = "Ticket summary must be between 5 and 100 characters.";
    }

    // 5. Validate Description (10 - 2000 characters trimmed)
    const trimmedDescription = typeof description === "string" ? description.trim() : "";
    if (!trimmedDescription || trimmedDescription.length < 10 || trimmedDescription.length > 2000) {
      fieldErrors.description = "Description must be between 10 and 2000 characters.";
    }

    // 6. Validate Priority
    let priority = "MEDIUM";
    if (requestedPriority) {
      const upper = String(requestedPriority).toUpperCase();
      if (ALLOWED_PRIORITIES.includes(upper)) {
        priority = upper;
      } else {
        fieldErrors.requestedPriority = "Requested priority must be LOW, MEDIUM, HIGH, or URGENT.";
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return res.status(400).json({
        error: "Validation Failed",
        message: "Please correct the field errors before submitting.",
        fieldErrors,
      });
    }

    // Process attachments
    const files = (req.files as Express.Multer.File[]) || [];
    const attachmentsData = files.map((file) => ({
      fileName: file.originalname,
      storedPath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      isRemoved: false,
    }));

    // Generate unique Ticket Number & create with retry
    let newTicket;
    let attempts = 0;
    while (attempts < 5) {
      try {
        const ticketNumber = await generateTicketNumber(prisma);
        newTicket = await prisma.ticket.create({
          data: {
            ticketNumber,
            requesterId,
            categoryId: Number(categoryId),
            relatedSystemId: Number(relatedSystemId),
            requestedPriority: priority,
            summary: trimmedSummary,
            description: trimmedDescription,
            status: "New",
            attachments: {
              create: attachmentsData,
            },
          },
          include: {
            requester: { select: { id: true, name: true, email: true, department: true } },
            category: { select: { id: true, name: true } },
            relatedSystem: { select: { id: true, name: true } },
            attachments: true,
          },
        });
        break;
      } catch (err: unknown) {
        if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
          attempts++;
          continue;
        }
        throw err;
      }
    }

    if (!newTicket) {
      return res.status(500).json({ error: "Failed to allocate unique ticket number." });
    }

    res.status(201).json(newTicket);
  } catch (err) {
    console.error("Failed to create ticket:", err);
    res.status(500).json({ error: "Failed to create support ticket." });
  }
});

// ---------------------------------------------------------------------------
// Lab 2 — Issue 4: My Tickets List Endpoint (Search, Filter, Sort, Pagination)
// ---------------------------------------------------------------------------

const ALLOWED_SORT_FIELDS = ["createdAt", "ticketNumber", "requestedPriority", "updatedAt"];

app.get("/api/tickets", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const rawRequesterId = req.headers["x-requester-id"] ?? req.query.requesterId;
    const requesterId = Number(rawRequesterId);

    if (!requesterId || isNaN(requesterId)) {
      return res.status(400).json({
        error: "Requester Context Required",
        message: "A valid x-requester-id header or requesterId query param is required.",
      });
    }

    // Query parameters
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const priority = typeof req.query.priority === "string" ? req.query.priority.toUpperCase() : undefined;
    const status = typeof req.query.status === "string" ? req.query.status : undefined;

    const sortBy = typeof req.query.sortBy === "string" && ALLOWED_SORT_FIELDS.includes(req.query.sortBy)
      ? req.query.sortBy
      : "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

    const page = Math.max(1, req.query.page ? Number(req.query.page) : 1);
    const pageSize = Math.min(50, Math.max(1, req.query.pageSize ? Number(req.query.pageSize) : 10));

    // Construct Prisma where clause strictly enforcing requester ownership
    const where: Prisma.TicketWhereInput = {
      requesterId,
    };

    if (categoryId && !isNaN(categoryId)) {
      where.categoryId = categoryId;
    }

    if (priority && ALLOWED_PRIORITIES.includes(priority)) {
      where.requestedPriority = priority;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
      ];
    }

    // Total matching count
    const totalItems = await prisma.ticket.count({ where });

    // Paginated fetch
    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        _count: {
          select: {
            attachments: { where: { isRemoved: false } },
          },
        },
      },
    });

    const data = tickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      summary: t.summary,
      description: t.description,
      requestedPriority: t.requestedPriority,
      itPriority: t.itPriority,
      status: t.status,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      category: t.category,
      relatedSystem: t.relatedSystem,
      attachmentCount: t._count.attachments,
    }));

    const totalPages = Math.ceil(totalItems / pageSize) || 1;

    res.status(200).json({
      data,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error("Failed to fetch tickets:", err);
    res.status(500).json({ error: "Failed to retrieve tickets." });
  }
});

// ---------------------------------------------------------------------------
// Lab 2 — Issue 5: Ticket Detail and Attachment Lifecycle Endpoints
// ---------------------------------------------------------------------------

// Single file upload middleware with error handling
const handleSingleUpload = (req: Request, res: Response, next: NextFunction) => {
  const uploadSingle = upload.single("file");
  uploadSingle(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: "File Too Large",
            message: "Attachment must be 5 MB or less.",
          });
        }
      }
      return res.status(400).json({
        error: "Invalid Attachment",
        message: err instanceof Error ? err.message : "Failed to process attachment upload",
      });
    }
    next();
  });
};

// 1. GET /api/tickets/:id — Get Owned Ticket Detail
app.get("/api/tickets/:id", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const rawRequesterId = req.headers["x-requester-id"] ?? req.query.requesterId;
    const requesterId = Number(rawRequesterId);

    if (!requesterId || isNaN(requesterId)) {
      return res.status(400).json({
        error: "Requester Context Required",
        message: "A valid x-requester-id header or requesterId query param is required.",
      });
    }

    const ticketId = Number(req.params.id);
    if (!ticketId || isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticket ID." });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        requester: { select: { id: true, name: true, email: true, department: true } },
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        attachments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found." });
    }

    // Ownership verification (BR-05, AC-12)
    if (ticket.requesterId !== requesterId) {
      return res.status(403).json({
        error: "Access Denied",
        message: "You do not have permission to view this ticket.",
      });
    }

    res.status(200).json(ticket);
  } catch (err) {
    console.error("Failed to retrieve ticket details:", err);
    res.status(500).json({ error: "Failed to retrieve ticket details." });
  }
});

// 2. POST /api/tickets/:id/attachments — Upload Attachment to Existing Ticket
app.post("/api/tickets/:id/attachments", handleSingleUpload, async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const rawRequesterId = req.headers["x-requester-id"] ?? req.body.requesterId;
    const requesterId = Number(rawRequesterId);

    if (!requesterId || isNaN(requesterId)) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: "Requester Context Required",
        message: "A valid x-requester-id header is required.",
      });
    }

    const ticketId = Number(req.params.id);
    if (!ticketId || isNaN(ticketId)) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Invalid ticket ID." });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        attachments: {
          where: { isRemoved: false },
        },
      },
    });

    if (!ticket) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: "Ticket not found." });
    }

    // Ownership check
    if (ticket.requesterId !== requesterId) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(403).json({
        error: "Access Denied",
        message: "You do not have permission to upload attachments to this ticket.",
      });
    }

    // Check active attachment quota (BR-12, AC-14)
    if (ticket.attachments.length >= 5) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: "Quota Exceeded",
        message: "Maximum 5 active attachments allowed per ticket.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "No File Uploaded",
        message: "Please select a file to upload.",
      });
    }

    const newAttachment = await prisma.attachment.create({
      data: {
        ticketId: ticket.id,
        fileName: req.file.originalname,
        storedPath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        isRemoved: false,
      },
    });

    res.status(201).json(newAttachment);
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    console.error("Failed to upload attachment:", err);
    res.status(500).json({ error: "Failed to upload attachment." });
  }
});

// 3. GET /api/attachments/:id/download — Download Active Attachment
app.get("/api/attachments/:id/download", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const rawRequesterId = req.headers["x-requester-id"] ?? req.query.requesterId;
    const requesterId = Number(rawRequesterId);

    if (!requesterId || isNaN(requesterId)) {
      return res.status(400).json({
        error: "Requester Context Required",
        message: "A valid x-requester-id header or requesterId query param is required.",
      });
    }

    const attachmentId = Number(req.params.id);
    if (!attachmentId || isNaN(attachmentId)) {
      return res.status(400).json({ error: "Invalid attachment ID." });
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: true },
    });

    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found." });
    }

    // Ownership check
    if (attachment.ticket.requesterId !== requesterId) {
      return res.status(403).json({
        error: "Access Denied",
        message: "You do not have permission to download this attachment.",
      });
    }

    // Soft removal check (BR-14, AC-17) -> return 410 Gone
    if (attachment.isRemoved) {
      return res.status(410).json({
        error: "Attachment Gone",
        message: "This attachment has been removed and cannot be downloaded.",
        removalReason: attachment.removalReason,
      });
    }

    if (!fs.existsSync(attachment.storedPath)) {
      return res.status(404).json({ error: "File not found on server disk." });
    }

    res.download(attachment.storedPath, attachment.fileName);
  } catch (err) {
    console.error("Failed to download attachment:", err);
    res.status(500).json({ error: "Failed to download attachment." });
  }
});

// 4. PATCH /api/attachments/:id/soft-remove — Soft-Remove Attachment with Mandatory Reason
app.patch("/api/attachments/:id/soft-remove", async (req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const rawRequesterId = req.headers["x-requester-id"] ?? req.body.requesterId;
    const requesterId = Number(rawRequesterId);

    if (!requesterId || isNaN(requesterId)) {
      return res.status(400).json({
        error: "Requester Context Required",
        message: "A valid x-requester-id header is required.",
      });
    }

    const attachmentId = Number(req.params.id);
    if (!attachmentId || isNaN(attachmentId)) {
      return res.status(400).json({ error: "Invalid attachment ID." });
    }

    const { reason } = req.body;
    const trimmedReason = typeof reason === "string" ? reason.trim() : "";
    if (!trimmedReason || trimmedReason.length < 3) {
      return res.status(400).json({
        error: "Validation Failed",
        message: "Removal reason is required and must be at least 3 characters.",
      });
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: true },
    });

    if (!attachment) {
      return res.status(404).json({ error: "Attachment not found." });
    }

    // Ownership check
    if (attachment.ticket.requesterId !== requesterId) {
      return res.status(403).json({
        error: "Access Denied",
        message: "You do not have permission to remove this attachment.",
      });
    }

    if (attachment.isRemoved) {
      return res.status(400).json({
        error: "Already Removed",
        message: "This attachment has already been removed.",
      });
    }

    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
    });
    const removedByName = requester?.name || `Requester #${requesterId}`;

    const updatedAttachment = await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        isRemoved: true,
        removalReason: trimmedReason,
        removedAt: new Date(),
        removedBy: removedByName,
      },
    });

    res.status(200).json(updatedAttachment);
  } catch (err) {
    console.error("Failed to soft-remove attachment:", err);
    res.status(500).json({ error: "Failed to remove attachment." });
  }
});

// ---------------------------------------------------------------------------
// Lab 3 — Issue 3: Administrator User Management Endpoints
// ---------------------------------------------------------------------------

// 1. GET /api/admin/users — Directory listing with search and role filters (AC-16)
app.get("/api/admin/users", authenticate, requireRole("ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const { search, role } = req.query;
    const where: Prisma.UserWhereInput = {};

    if (role && typeof role === "string" && ["REQUESTER", "IT_STAFF", "ADMINISTRATOR"].includes(role)) {
      where.role = role as any;
    }

    if (search && typeof search === "string" && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const users = await getPrisma().user.findMany({
      where,
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    res.status(200).json(users);
  } catch (err) {
    console.error("Failed to list admin users:", err);
    res.status(500).json({ error: "Failed to list users." });
  }
});

// 2. POST /api/admin/users — Provision new user with initial password (AC-17, AC-18)
app.post("/api/admin/users", authenticate, requireRole("ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const { name, email, role, department, isActive, initialPassword } = req.body;

    if (!name || !email || !role || !initialPassword) {
      return res.status(400).json({
        error: "Validation Failed",
        message: "Name, email, role, and initialPassword are required.",
      });
    }

    if (!["REQUESTER", "IT_STAFF", "ADMINISTRATOR"].includes(role)) {
      return res.status(400).json({
        error: "Validation Failed",
        message: "Invalid role specified.",
      });
    }

    if (typeof initialPassword !== "string" || initialPassword.length < 8) {
      return res.status(400).json({
        error: "Validation Failed",
        message: "Initial password must be at least 8 characters in length.",
      });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const existing = await getPrisma().user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existing) {
      return res.status(409).json({
        error: "Conflict",
        message: "A user with this email address already exists.",
        fieldErrors: { email: "Email is already registered." },
      });
    }

    const passwordHash = await hashPassword(String(initialPassword));
    const newUser = await getPrisma().user.create({
      data: {
        name: String(name).trim(),
        email: trimmedEmail,
        role,
        department: department ? String(department).trim() : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        passwordHash,
        mustChangePassword: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    res.status(201).json(newUser);
  } catch (err) {
    console.error("Failed to create admin user:", err);
    res.status(500).json({ error: "Failed to create user." });
  }
});

// 3. PATCH /api/admin/users/:id — Edit user profile and state with safety guardrails (AC-18, AC-19, AC-20)
app.patch("/api/admin/users/:id", authenticate, requireRole("ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const targetId = Number(req.params.id);
    if (!targetId || isNaN(targetId)) {
      return res.status(400).json({ error: "Invalid user ID." });
    }

    const target = await getPrisma().user.findUnique({
      where: { id: targetId },
    });

    if (!target) {
      return res.status(404).json({ error: "User not found." });
    }

    // Safety Invariant: Self-deactivation prevention (BR-22, AC-19)
    if (target.id === req.user!.id && req.body.isActive === false) {
      return res.status(400).json({
        error: "Bad Request",
        message: "You cannot deactivate your own account.",
      });
    }

    // Safety Invariant: Last active administrator protection (BR-23, AC-20)
    const isCurrentlyActiveAdmin = target.role === "ADMINISTRATOR" && target.isActive;
    const attemptsDeactivation = req.body.isActive === false;
    const attemptsDemotion = req.body.role !== undefined && req.body.role !== "ADMINISTRATOR";

    if (isCurrentlyActiveAdmin && (attemptsDeactivation || attemptsDemotion)) {
      const activeAdminCount = await getPrisma().user.count({
        where: { role: "ADMINISTRATOR", isActive: true },
      });

      if (activeAdminCount <= 1) {
        return res.status(400).json({
          error: "Bad Request",
          message: "Cannot deactivate or change role of the last active Administrator.",
        });
      }
    }

    // Duplicate email check (BR-25, AC-18)
    if (req.body.email !== undefined) {
      const newEmail = String(req.body.email).trim().toLowerCase();
      if (newEmail !== target.email.toLowerCase()) {
        const existingWithEmail = await getPrisma().user.findUnique({
          where: { email: newEmail },
        });

        if (existingWithEmail && existingWithEmail.id !== target.id) {
          return res.status(409).json({
            error: "Conflict",
            message: "A user with this email address already exists.",
            fieldErrors: { email: "Email is already registered." },
          });
        }
      }
    }

    if (req.body.role !== undefined && !["REQUESTER", "IT_STAFF", "ADMINISTRATOR"].includes(req.body.role)) {
      return res.status(400).json({
        error: "Validation Failed",
        message: "Invalid role specified.",
      });
    }

    const dataToUpdate: Prisma.UserUpdateInput = {};
    if (req.body.name !== undefined) dataToUpdate.name = String(req.body.name).trim();
    if (req.body.email !== undefined) dataToUpdate.email = String(req.body.email).trim().toLowerCase();
    if (req.body.role !== undefined) dataToUpdate.role = req.body.role;
    if (req.body.department !== undefined) dataToUpdate.department = req.body.department ? String(req.body.department).trim() : null;
    if (req.body.isActive !== undefined) dataToUpdate.isActive = Boolean(req.body.isActive);

    const updatedUser = await getPrisma().user.update({
      where: { id: targetId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("Failed to update user:", err);
    res.status(500).json({ error: "Failed to update user." });
  }
});

// 4. POST /api/admin/users/:id/reset-password — Reset initial password with forced change flag
app.post("/api/admin/users/:id/reset-password", authenticate, requireRole("ADMINISTRATOR"), async (req: Request, res: Response) => {
  try {
    const targetId = Number(req.params.id);
    if (!targetId || isNaN(targetId)) {
      return res.status(400).json({ error: "Invalid user ID." });
    }

    const target = await getPrisma().user.findUnique({
      where: { id: targetId },
    });

    if (!target) {
      return res.status(404).json({ error: "User not found." });
    }

    const newPassword = req.body.newInitialPassword || req.body.initialPassword;
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({
        error: "Validation Failed",
        message: "New initial password must be at least 8 characters in length.",
      });
    }

    const passwordHash = await hashPassword(newPassword);
    await getPrisma().user.update({
      where: { id: targetId },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
    });

    res.status(200).json({ message: "Initial password reset successfully." });
  } catch (err) {
    console.error("Failed to reset password:", err);
    res.status(500).json({ error: "Failed to reset password." });
  }
});

export default app;
