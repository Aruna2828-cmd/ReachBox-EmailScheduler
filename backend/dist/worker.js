"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const connection = new ioredis_1.default({
    host: "localhost",
    port: 6379,
    maxRetriesPerRequest: null,
});
const worker = new bullmq_1.Worker("email-queue", async (job) => {
    console.log("Processing job:", job.id);
    console.log("Email data:", job.data);
    return { success: true };
}, {
    connection,
    concurrency: 5,
});
worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed successfully`);
});
worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
});
console.log("Email worker is running!");
