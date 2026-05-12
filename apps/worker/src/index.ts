import { Worker, Job } from "bullmq";
import fs from "fs";
import csv from "csv-parser";
import { createObjectCsvWriter } from "csv-writer";

import { logger, redisConnection, bulkVerificationQueue, createRedisClient } from "@nfe/config";
import { connectDB, BulkJob } from "@nfe/database";
import { VerificationService } from "@nfe/core";

// Ensure models are available
import "@nfe/database";

// Fallback logic to emit via redis if websocket isn't directly connected to the worker
const redisPublisher = createRedisClient();

async function start() {
  await connectDB();

  const bulkWorker = new Worker(
    "bulkVerificationQueue",
    async (job: Job) => {
      logger.info({ jobId: job.id, type: job.name }, "Processing job");

      if (job.name === "processCsv") {
        const { jobId: dbJobId, userId, filePath } = job.data;

        const bulkJob = await BulkJob.findById(dbJobId);
        if (!bulkJob) throw new Error("Bulk job not found in DB");

        bulkJob.status = "processing";
        await bulkJob.save();

        let processedCount = 0;
        let batch: any[] = [];
        const BATCH_SIZE = 500;

        return new Promise((resolve, reject) => {
          const stream = fs.createReadStream(filePath).pipe(csv());

          stream
            .on("data", async (row) => {
              batch.push(row);

              if (batch.length >= BATCH_SIZE) {
                stream.pause();

                const currentBatch = [...batch];
                batch = [];

                try {
                  await bulkVerificationQueue.add("processChunk", {
                    userId,
                    jobId: dbJobId,
                    rows: currentBatch,
                    resultsPath: filePath + "_results.csv",
                    isLastChunk: false,
                  });

                  processedCount += currentBatch.length;
                  const progress = (processedCount / bulkJob.totalEmails) * 100;
                  await job.updateProgress(progress);
                } catch (e) {
                  logger.error({ e }, "Error queueing chunk");
                }

                stream.resume();
              }
            })
            .on("end", async () => {
              // process final batch
              if (batch.length > 0) {
                await bulkVerificationQueue.add("processChunk", {
                  userId,
                  jobId: dbJobId,
                  rows: batch,
                  resultsPath: filePath + "_results.csv",
                  isLastChunk: true,
                });
                processedCount += batch.length;
                const progress = (processedCount / bulkJob.totalEmails) * 100;
                await job.updateProgress(progress);
              } else {
                // Trigger completion if exact multiple of batch size
                await bulkVerificationQueue.add("processChunk", {
                  userId,
                  jobId: dbJobId,
                  rows: [],
                  resultsPath: filePath + "_results.csv",
                  isLastChunk: true,
                });
              }

              logger.info({ jobId: dbJobId }, "CSV Chunking complete");
              resolve({ status: "chunked" });
            })
            .on("error", async (err) => {
              bulkJob.status = "failed";
              await bulkJob.save();
              logger.error({ err, jobId: dbJobId }, "Bulk processing error");
              reject(err);
            });
        });
      }

      if (job.name === "processChunk") {
        const {
          userId,
          jobId: dbJobId,
          rows,
          resultsPath,
          isLastChunk,
        } = job.data;

        const results: any[] = [];

        // Process serially within chunk or map concurrently (limit concurrency)
        for (const row of rows) {
          const emailKey =
            Object.keys(row).find((k) => k.toLowerCase().includes("email")) ||
            Object.keys(row)[0];
          const email = row[emailKey];

          if (email) {
            try {
              const result = await VerificationService.verifyEmail(email);
              results.push({ ...row, ...result });
            } catch (e) {
              results.push({ ...row, status: "error", score: 0 });
            }
          } else {
            results.push({ ...row, status: "invalid", score: 0 });
          }
        }

        // Append to CSV
        if (results.length > 0) {
          const headers = Object.keys(results[0]).map((id) => ({
            id,
            title: id,
          }));

          const fileExists = fs.existsSync(resultsPath);
          const csvWriter = createObjectCsvWriter({
            path: resultsPath,
            header: headers,
            append: fileExists,
          });
          await csvWriter.writeRecords(results);
        }

        const bulkJob = await BulkJob.findById(dbJobId);
        if (!bulkJob) return { status: "error", reason: "job missing" };

        bulkJob.processedEmails += rows.length;
        await bulkJob.save();

        const progress = (bulkJob.processedEmails / bulkJob.totalEmails) * 100;
        await redisPublisher.publish(
          "bulk-progress",
          JSON.stringify({
            userId: userId,
            jobId: dbJobId,
            progress: Math.round(progress),
            status: "processing",
          }),
        );

        if (isLastChunk) {
          bulkJob.status = "completed";
          // We need a URL that the user can download. We are in the worker so we don't have the frontend URL easily.
          // We assume /uploads is mounted, and the backend statically serves it at /uploads.
          // Extract the filename from the resultsPath
          const fileName = resultsPath.split('/').pop() || resultsPath;
          bulkJob.resultsUrl = `/uploads/${fileName}`;
          await bulkJob.save();

          await redisPublisher.publish(
            "bulk-progress",
            JSON.stringify({
              userId: userId,
              jobId: dbJobId,
              progress: 100,
              status: "completed",
            }),
          );
        }

        return { status: "chunk processed" };
      }
    },
    {
      connection: redisConnection,
      concurrency: parseInt(process.env.WORKER_CONCURRENCY || "5", 10),
    },
  );

  bulkWorker.on("completed", (job) => {
    logger.info({ jobId: job.id }, "Job completed successfully in worker");
  });

  bulkWorker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err }, "Job failed in worker");
  });

  logger.info("Worker started successfully");

  const shutdown = async () => {
    logger.info("Shutting down worker...");
    await bulkWorker.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start();
