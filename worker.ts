import { Worker } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "email-queue",
  async (job) => {
    console.log("Processing job:", job.id);
    console.log("Email data:", job.data);

    return { success: true };
  },
  {
    connection,
    concurrency: 5,
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

console.log("Email worker is running!");