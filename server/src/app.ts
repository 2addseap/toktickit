import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import { Prisma } from "@prisma/client";
import { getPrisma } from "./prisma.js";
import { upload, generateTicketNumber } from "./upload.js";

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
// Lab 2 — Issue 2: Development Requester Context & Reference Data Endpoints
// ---------------------------------------------------------------------------

// 1. Get Active Development Requesters
app.get("/api/requesters", async (_req: Request, res: Response) => {
  try {
    const requesters = await getPrisma().requesterUser.findMany({
      where: { isActive: true },
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
      const requester = await prisma.requesterUser.findUnique({
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

export default app;
