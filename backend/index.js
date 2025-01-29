const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const corsOptions = require("./config/corsOptions");
const compileRoutes = require("./routes/compile.js");
const socketHandlers = require("./socket/handlers");
const ACTIONS = require("./Actions.js");
const cors = require("cors");
const githubRoutes = require('./routes/githubRoutes.js');


dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});

const port = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors(corsOptions));



// API Routes
app.use("/compile", compileRoutes);

app.use('/github', githubRoutes);

// Socket Handlers
const userSocketMap = {};
socketHandlers(io, userSocketMap, ACTIONS);

// Start Server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
