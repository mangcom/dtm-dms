import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { PositionType } from "@prisma/client";
import { env } from "../config/env";
import { HttpError } from "./errorHandler";

// Carries the user's currently-*active* position (chosen at login or via
// POST /api/auth/switch-position) — not the full list of positions they hold.
// department/workSection scope is denormalized here so requirePosition can
// check authorization synchronously off the JWT, no DB round-trip per request
// (trade-off: if admin revokes a position mid-session, the old token keeps
// working until it expires (8h) or the user switches position again).
export interface AuthTokenPayload {
  sub: string;
  username: string;
  activePositionId: string;
  activePositionType: PositionType;
  activeDepartmentId?: string;
  activeWorkSectionId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

const COOKIE_NAME = "dtm_token";

export function signToken(payload: AuthTokenPayload): string {
  const options: jwt.SignOptions = { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    maxAge: 8 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME);
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) throw new HttpError(401, "Not authenticated");
  try {
    req.user = jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
    next();
  } catch {
    throw new HttpError(401, "Invalid or expired session");
  }
}

/** Checks the user's currently-active position type — not every position they hold. */
export function requirePosition(...types: PositionType[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new HttpError(401, "Not authenticated");
    if (!types.includes(req.user.activePositionType)) {
      throw new HttpError(403, "Insufficient permissions");
    }
    next();
  };
}
