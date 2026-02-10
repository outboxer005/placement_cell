import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthUser {
  sub: string; // for admin: admin_id; for student: student_id
  role: "main-admin" | "branch-admin" | "student";
  email?: string;
  branch?: string | null;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET not set in environment variables");
      return res.status(500).json({ error: "Server configuration error" });
    }
    const payload = jwt.verify(token, secret) as AuthUser;
    (req as any).user = payload;
    next();
  } catch (error) {
    console.error("JWT verification failed:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireMainAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as AuthUser | undefined;
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  if (user.role !== "main-admin") return res.status(403).json({ error: "Forbidden" });
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as AuthUser | undefined;
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  if (user.role !== "main-admin" && user.role !== "branch-admin") {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  next();
}

