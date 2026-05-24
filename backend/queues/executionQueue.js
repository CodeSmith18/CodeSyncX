import { Queue } from "bullmq";
import { getRedisConnectionOptions } from "../config/redis.js";

export const EXECUTION_QUEUE_NAME = "code-execution";

const connection = getRedisConnectionOptions();

export const executionQueue = new Queue(EXECUTION_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: {
      age: Number(process.env.EXECUTION_JOB_TTL_SECONDS || 3600),
      count: Number(process.env.EXECUTION_JOB_HISTORY_LIMIT || 1000),
    },
    removeOnFail: {
      age: Number(process.env.EXECUTION_JOB_TTL_SECONDS || 3600),
      count: Number(process.env.EXECUTION_JOB_HISTORY_LIMIT || 1000),
    },
  },
});

export const addExecutionJob = async ({ language, code, input }) => {
  const job = await executionQueue.add("execute-code", {
    language,
    code,
    input,
    queuedAt: Date.now(),
  });

  return job.id;
};

export const getExecutionJobStatus = async (jobId) => {
  const job = await executionQueue.getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();

  return {
    id: job.id,
    status: state,
    result: job.returnvalue || null,
    failedReason: job.failedReason || null,
    progress: job.progress,
    createdAt: job.timestamp,
    processedAt: job.processedOn || null,
    finishedAt: job.finishedOn || null,
  };
};
