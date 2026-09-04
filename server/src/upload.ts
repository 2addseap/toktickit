import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const UPLOADS_DIR = path.resolve(__dirname, "../uploads/attachments");

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const safeName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    cb(null, `${safeName}-${uniqueSuffix}${ext}`);
  },
});

export const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: JPG, PNG, WEBP, PDF`));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5,
  },
  fileFilter,
});

/**
 * Generate a unique sequential Ticket Number in format TKT-YYYY-NNNNNN
 */
export async function generateTicketNumber(prisma: PrismaClient): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `TKT-${currentYear}-`;

  const lastTicket = await prisma.ticket.findFirst({
    where: { ticketNumber: { startsWith: yearPrefix } },
    orderBy: { id: "desc" },
    select: { ticketNumber: true },
  });

  let maxSeq = 0;
  if (lastTicket) {
    const parts = lastTicket.ticketNumber.split("-");
    const num = parseInt(parts[2], 10);
    if (!isNaN(num)) maxSeq = num;
  }

  const totalCount = await prisma.ticket.count({
    where: { ticketNumber: { startsWith: yearPrefix } },
  });

  let seq = Math.max(maxSeq, totalCount) + 1;
  let candidate = `${yearPrefix}${String(seq).padStart(6, "0")}`;

  while (await prisma.ticket.findUnique({ where: { ticketNumber: candidate } })) {
    seq++;
    candidate = `${yearPrefix}${String(seq).padStart(6, "0")}`;
  }

  return candidate;
}
