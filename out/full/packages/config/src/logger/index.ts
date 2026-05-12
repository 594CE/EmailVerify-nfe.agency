import pino from "pino";
import pinoHttp from "pino-http";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: { colorize: true },
        }
      : undefined,
});

export const httpLogger = pinoHttp({
  logger: logger as any,
  customProps: (req) => {
    return {
      correlationId: req.headers["x-correlation-id"] || "none",
    };
  },
});
