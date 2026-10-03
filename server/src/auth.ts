import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPrisma } from "./prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || "toktickit-secret-jwt-token-key-2026-cpe334";
const SALT_ROUNDS = 10;

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";
  department?: string | null;
  mustChangePassword: boolean;
}

// Augment Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// ---------------------------------------------------------------------------
// 1. Password Hashing & Complexity Validation
// ---------------------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePasswordComplexity(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof password !== "string" || password.length < 8) {
    errors.push("Password must be at least 8 characters in length.");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must include at least one uppercase letter.");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must include at least one lowercase letter.");
  }
  if (!/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push("Password must include at least one number or special character.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ---------------------------------------------------------------------------
// 2. JWT Generation & Verification
// ---------------------------------------------------------------------------

export function generateToken(payload: { id: number; email: string; role: string; mustChangePassword: boolean }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 3. Authentication & Role Authorization Middleware
// ---------------------------------------------------------------------------

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication token required.",
    });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded || !decoded.id) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired authentication token.",
    });
  }

  try {
    const user = await getPrisma().user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        mustChangePassword: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Account is inactive or does not exist.",
      });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR",
      department: user.department,
      mustChangePassword: user.mustChangePassword,
    };

    // Mandatory First-Login Password Change Interceptor (BR-02, AC-03)
    // Permitted paths when mustChangePassword is true:
    // /api/auth/change-password, /api/auth/me, /api/auth/logout
    if (req.user.mustChangePassword) {
      const allowedPaths = ["/api/auth/change-password", "/api/auth/me", "/api/auth/logout"];
      const isAllowed = allowedPaths.some((path) => req.baseUrl + req.path === path || req.path === path);
      if (!isAllowed) {
        return res.status(403).json({
          error: "Password Change Required",
          code: "PASSWORD_CHANGE_REQUIRED",
          message: "You must change your temporary password before accessing the application.",
        });
      }
    }

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(500).json({ error: "Authentication failed." });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Access Denied",
        message: "You do not have permission to access this resource.",
      });
    }

    next();
  };
}
