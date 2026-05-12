import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "@nfe/config";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const authenticateJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(
      token,
      process.env.JWT_SECRET || "supersecret",
      (err: any, user: any) => {
        if (err) {
          logger.warn("Invalid JWT token");
          return res.status(403).json({ message: "Forbidden" });
        }

        req.user = user;
        next();
      },
    );
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

export const requireRole = (role: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === role) {
      next();
    } else {
      res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
  };
};
