import express from "express";
import http from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import corsOptions from "./config/corsOptions.js";
import { createRedisClient } from "./config/redis.js";
import { configureSocketRedisAdapter } from "./config/socketRedisAdapter.js";
import compileRoutes from "./routes/compile.js";
import socketHandlers from "./socket/handlers.js";
import ACTIONS from "./Actions.js";
import githubRoutes from './routes/githubRoutes.js';
import mongoConfig from "./db/mongooseConfig.js";
import userRoutes from './routes/userRoutes.js';
import {
  authLimiter,
  generalLimiter,
  githubLimiter,
} from "./middleware/rateLimiters.js";


dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});

const port = process.env.PORT || 5000;
const host = process.env.HOST || "0.0.0.0";

if (process.env.TRUST_PROXY_HOPS) {
  app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS));
}

// Middleware
app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use(generalLimiter);



// API Routes
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    redis: process.env.REDIS_URL ? "configured" : "not_configured",
    executionMode: process.env.EXECUTION_MODE || "local",
  });
});

app.get("/health/redis", async (req, res) => {
  const client = createRedisClient("health");

  try {
    await client.connect();
    const pong = await client.ping();
    res.json({ status: "ok", redis: pong });
  } catch (error) {
    res.status(503).json({ status: "error", redis: error.message });
  } finally {
    await client.disconnect().catch(() => {});
  }
});

app.use("/compile", compileRoutes);

app.use('/github', githubLimiter, githubRoutes);
app.use('/users/signup', authLimiter);
app.use('/users/login', authLimiter);
app.use('/users',userRoutes);

// Socket Handlers
const userSocketMap = {};
const startServer = async () => {
  try {
    await configureSocketRedisAdapter(io);
  } catch (error) {
    console.error("[socket] Redis adapter failed to start", error.message);
    process.exit(1);
  }

  socketHandlers(io, userSocketMap, ACTIONS);
  mongoConfig();

  server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
  });
};

startServer();
