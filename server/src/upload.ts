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

  // Count tickets created in the current year
  const count = await prisma.ticket.count({
    where: {
      ticketNumber: {
        startsWith: yearPrefix,
      },
    },
  });

  const nextSeq = String(count + 1).padStart(6, "0");
  let ticketNumber = `${yearPrefix}${nextSeq}`;

  // Double check uniqueness
  let exists = await prisma.ticket.findUnique({ where: { ticketNumber } });
  let offset = 1;
  while (exists) {
    const fallbackSeq = String(count + 1 + offset).padStart(6, "0");
    ticketNumber = `${yearPrefix}${fallbackSeq}`;
    exists = await prisma.ticket.findUnique({ where: { ticketNumber } });
    offset++;
  }

  return ticketNumber;
}
