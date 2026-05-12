import { Request, Response } from "express";
import { VerificationLog } from "@nfe/database";
import { logger } from "@nfe/config";

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const logs = await VerificationLog.find({ userId });

    const total = logs.length;
    let valid = 0;
    let invalid = 0;
    let risky = 0;
    let disposable = 0;
    let catchAll = 0;

    logs.forEach((log) => {
      switch (log.status) {
        case "valid":
          valid++;
          break;
        case "invalid":
          invalid++;
          break;
        case "risky":
          risky++;
          break;
        case "disposable":
          disposable++;
          break;
        case "catch-all":
          catchAll++;
          break;
      }
    });

    const successRate = total ? (valid / total) * 100 : 0;
    const bounceRisk = total ? ((invalid + risky) / total) * 100 : 0;

    // In a real application, you might use MongoDB aggregations for this
    // e.g. await VerificationLog.aggregate([...])

    res.json({
      total,
      valid,
      invalid,
      risky,
      disposable,
      catchAll,
      successRate: successRate.toFixed(1),
      bounceRisk: bounceRisk.toFixed(1),
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching analytics");
    res.status(500).json({ message: "Internal Server Error" });
  }
};
