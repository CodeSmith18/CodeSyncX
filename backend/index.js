import express from "express";
import http from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

import corsOptions from "./config/corsOptions.js";
import compileRoutes from "./routes/compile.js";
import socketHandlers from "./socket/handlers.js";
import ACTIONS from "./Actions.js";
import githubRoutes from "./routes/githubRoutes.js";
import mongoConfig from "./db/mongooseConfig.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

// ⛳ Setup __dirname (since you're using ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});

const port = process.env.PORT || 5000;

// 🔧 Middleware
app.use(bodyParser.json());
app.use(cors(corsOptions));

// 🔌 API Routes
app.use("/compile", compileRoutes);
app.use("/github", githubRoutes);
app.use("/users", userRoutes);

// ⚡ Socket.IO handlers
const userSocketMap = {};
socketHandlers(io, userSocketMap, ACTIONS);

// 🔗 MongoDB connection
mongoConfig();

// 📦 Serve React frontend (from build folder)
app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// 🚀 Start Server
server.listen(port,"0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${port}`);
});
