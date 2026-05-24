import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { createRedisClient } from "../config/redis.js";

const createStore = (name) => {
  if (process.env.REDIS_RATE_LIMIT_ENABLED !== "true") {
    return undefined;
  }

  const client = createRedisClient(`rate-limit:${name}`);
  client.connect().catch((error) => {
    console.error(`[rate-limit:${name}] Redis connection failed`, error.message);
  });

  return new RedisStore({
    sendCommand: (...args) => client.sendCommand(args),
    prefix: `rl:${name}:`,
  });
};

const createLimiter = ({ name, windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore(name),
    message: {
      success: false,
      error: message,
    },
  });

export const generalLimiter = createLimiter({
  name: "general",
  windowMs: Number(process.env.RATE_LIMIT_GENERAL_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_GENERAL_MAX || 100),
  message: "Too many requests. Please try again later.",
});

export const authLimiter = createLimiter({
  name: "auth",
  windowMs: Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_AUTH_MAX || 10),
  message: "Too many authentication attempts. Please try again later.",
});

export const compileLimiter = createLimiter({
  name: "compile",
  windowMs: Number(process.env.RATE_LIMIT_COMPILE_WINDOW_MS || 60 * 1000),
  max: Number(process.env.RATE_LIMIT_COMPILE_MAX || 20),
  message: "Too many code execution requests. Please slow down.",
});

export const githubLimiter = createLimiter({
  name: "github",
  windowMs: Number(process.env.RATE_LIMIT_GITHUB_WINDOW_MS || 60 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_GITHUB_MAX || 30),
  message: "Too many GitHub requests. Please try again later.",
});
