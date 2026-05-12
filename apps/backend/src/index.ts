import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import http from "http";
import { randomUUID } from "crypto";

import { httpLogger, logger } from "@nfe/config";
import { connectDB } from "@nfe/database";
import { initWebSocket } from "./websockets";

import authRoutes from "./routes/auth.routes";
import teamRoutes from "./routes/team.routes";
import billingRoutes from "./routes/billing.routes";
import verificationRoutes from "./routes/verification.routes";
import analyticsRoutes from "./routes/analytics.routes";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { verificationQueue, bulkVerificationQueue } from "@nfe/config";

const app = express();

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [
    new BullMQAdapter(verificationQueue),
    new BullMQAdapter(bulkVerificationQueue),
  ],
  serverAdapter: serverAdapter,
});

app.use((req: Request, res: Response, next: NextFunction) => {
  req.headers["x-correlation-id"] =
    req.headers["x-correlation-id"] || randomUUID();
  next();
});

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(compression());
// Webhook route needs raw body parser
app.use("/api/billing/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(cookieParser());
app.use(httpLogger);

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/verify", verificationRoutes);
app.use("/api/analytics", analyticsRoutes);

import { authenticateJWT, requireRole } from "./middlewares/auth";

// Bull Board Admin UI
app.use(
  "/admin/queues",
  authenticateJWT,
  requireRole("admin"),
  serverAdapter.getRouter(),
);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({ err }, "Unhandled Error");
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    correlationId: req.headers["x-correlation-id"],
  });
});

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);
initWebSocket(server);

// Start listening to redis events
import "./websockets/redisSubscriber";

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
};

if (require.main === module) {
  startServer();
}

export default server;
