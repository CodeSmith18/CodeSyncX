import dotenv from "dotenv";
import { Worker } from "bullmq";
import { getRedisConnectionOptions } from "../config/redis.js";
import { EXECUTION_QUEUE_NAME } from "../queues/executionQueue.js";
import { executeCode } from "../services/executionService.js";

dotenv.config();

const worker = new Worker(
  EXECUTION_QUEUE_NAME,
  async (job) => {
    const startedAt = Date.now();
    const result = await executeCode(job.data);

    console.log(
      `[worker] job=${job.id} language=${job.data.language} success=${result.success} durationMs=${Date.now() - startedAt}`
    );

    return result;
  },
  {
    connection: getRedisConnectionOptions(),
    concurrency: Number(process.env.EXECUTION_WORKER_CONCURRENCY || 2),
  }
);

worker.on("ready", () => {
  console.log(`[worker] listening on queue "${EXECUTION_QUEUE_NAME}"`);
});

worker.on("failed", (job, error) => {
  console.error(`[worker] job=${job?.id} failed`, error.message);
});

const shutdown = async () => {
  await worker.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
