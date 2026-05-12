import { Request, Response } from "express";
import { verificationQueue, bulkVerificationQueue } from "@nfe/config";
import { VerificationLog } from "@nfe/database";
import { BulkJob } from "@nfe/database";
import { VerificationService } from "@nfe/core";
import { logger } from "@nfe/config";
import fs from "fs";
import csv from "csv-parser";

export const verifySingleEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const userId = (req as any).user.userId;

    const result = await VerificationService.verifyEmail(email);

    const log = new VerificationLog({
      userId,
      email,
      status: result.status,
      score: result.score,
      provider: "internal",
    });
    await log.save();

    res.json({ email, ...result });
  } catch (error) {
    logger.error({ err: error }, "Error verifying email");
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyBulkUpload = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const userId = (req as any).user.userId;

    if (!file) return res.status(400).json({ message: "No file uploaded" });

    let totalEmails = 0;

    // Quick count of emails to initialize the job correctly
    await new Promise((resolve, reject) => {
      fs.createReadStream(file.path)
        .pipe(csv())
        .on("data", () => totalEmails++)
        .on("end", resolve)
        .on("error", reject);
    });

    const bulkJob = new BulkJob({
      userId,
      fileName: file.originalname,
      totalEmails,
      processedEmails: 0,
      status: "pending",
    });
    await bulkJob.save();

    // Enqueue the bulk job to be processed by workers
    await bulkVerificationQueue.add("processCsv", {
      jobId: bulkJob._id.toString(),
      userId,
      filePath: file.path,
      originalName: file.originalname,
    });

    res.status(202).json({
      message: "File uploaded and queued for processing",
      jobId: bulkJob._id,
    });
  } catch (error) {
    logger.error({ err: error }, "Error uploading bulk file");
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const logs = await VerificationLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getBulkJobs = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const jobs = await BulkJob.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
