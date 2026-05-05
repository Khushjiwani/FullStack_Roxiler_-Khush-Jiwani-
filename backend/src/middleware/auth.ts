import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type AuthRequest = Request & { user?: { id: number; role: string } };

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.toString().split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  jwt.verify(token, process.env.JWT_SECRET || "secret", (err, payload) => {
    if (err || typeof payload !== "object") {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = { id: Number((payload as any).id), role: (payload as any).role };
    next();
  });
}

export function authorizeRoles(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
