import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
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

    // Generate unique Ticket Number
    const ticketNumber = await generateTicketNumber(prisma);

    // Process attachments
    const files = (req.files as Express.Multer.File[]) || [];
    const attachmentsData = files.map((file) => ({
      fileName: file.originalname,
      storedPath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      isRemoved: false,
    }));

    // Create Ticket in DB
    const newTicket = await prisma.ticket.create({
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

    res.status(201).json(newTicket);
  } catch (err) {
    console.error("Failed to create ticket:", err);
    res.status(500).json({ error: "Failed to create support ticket." });
  }
});

export default app;
