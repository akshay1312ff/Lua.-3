import { createHmac } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

const ADMIN_USERNAME = process.env["ADMIN_USERNAME"] ?? "akshu";
const ADMIN_PASSWORD = process.env["ADMIN_PASSWORD"] ?? "akshu123";
const SESSION_SECRET = process.env["SESSION_SECRET"] ?? "akshu-secret-key";

export const ADMIN_COOKIE = "akshu_admin_token";

export function generateSessionToken(): string {
  return createHmac("sha256", SESSION_SECRET)
    .update(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`)
    .digest("hex");
}

export function verifyCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function isAuthenticated(req: Request): boolean {
  const token = req.cookies?.[ADMIN_COOKIE];
  if (!token) return false;
  return token === generateSessionToken();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}
