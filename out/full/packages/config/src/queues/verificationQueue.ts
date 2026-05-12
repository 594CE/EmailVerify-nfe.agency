import { Queue } from "bullmq";
import { redisConnection } from "./connection";

export const verificationQueue = new Queue("verificationQueue", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: 1000,
  },
});

export const bulkVerificationQueue = new Queue("bulkVerificationQueue", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: true,
  },
});
