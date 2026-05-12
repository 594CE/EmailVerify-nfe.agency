import rateLimit from "express-rate-limit";
import { logger } from "@nfe/config";

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn({ ip: req.ip }, "Rate limit exceeded");
    res
      .status(429)
      .json({ message: "Too many requests, please try again later." });
  },
});
