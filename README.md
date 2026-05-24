# CodeSyncX

CodeSyncX is a real-time collaborative code editor built with React, CodeMirror, Express, Socket.IO, and MongoDB. Users can create shared coding rooms, edit together live, run C++, Java, and Python code, save programs, and upload editor contents to GitHub.

## Features

- Real-time collaborative editing with Socket.IO rooms.
- Browser code editor powered by CodeMirror.
- Code execution for C++, Java, and Python.
- Email/password authentication with JWT.
- GitHub OAuth login and GitHub file upload with Octokit.
- Saved programs dashboard backed by MongoDB.
- Shareable editor room links.

## Tech Stack

- Frontend: React, React Router, CodeMirror, Socket.IO Client
- Backend: Node.js, Express, Socket.IO
- Database: MongoDB with Mongoose
- Auth: JWT, bcrypt, GitHub OAuth
- GitHub API: Octokit
- Runtime: Node.js 20
- Queue/Realtime Scaling: Redis, BullMQ, Socket.IO Redis Adapter

## Prerequisites

- Node.js 20
- MongoDB local instance or MongoDB Atlas URI
- Redis for queued code execution
- GitHub OAuth App for GitHub login/upload

If you use `nvm`:

```bash
nvm use
```

## Environment Variables

Create `backend/.env` from `backend/.env.example`:

```env
PORT=5000
MONGO_URL=mongodb://127.0.0.1:27017/codesyncx
JWT_SECRET=change_me
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/login
SESSION_SECRET=change_me
REDIS_URL=redis://127.0.0.1:6379
SOCKET_REDIS_ADAPTER_ENABLED=false
REDIS_RATE_LIMIT_ENABLED=false
EXECUTION_MODE=local
```

For MongoDB Atlas, replace `MONGO_URL` with your `mongodb+srv://...` connection string.

Create `client/.env` from `client/.env.example`:

```env
REACT_APP_BACKEND_URL=http://localhost:5000
REACT_APP_GITHUB_CLIENT_ID=your_github_client_id
```

For local GitHub OAuth testing, set your GitHub OAuth App callback URL to:

```text
http://localhost:3000/login
```

## Local Setup

Install dependencies:

```bash
npm run install:all
```

Start the backend:

```bash
npm run dev:backend
```

Start the execution worker in a second terminal:

```bash
npm run dev:worker
```

Start the frontend in a third terminal:

```bash
npm run dev:client
```

Open:

```text
http://localhost:3000
```

## Production Deployment

The recommended single-server deployment is:

- Nginx serves `client/build`.
- Nginx proxies `/compile`, `/github`, `/users`, `/health`, and `/socket.io` to the backend on `127.0.0.1:5000`.
- PM2 runs the backend API and execution worker.
- Redis runs locally through Docker Compose.
- MongoDB runs on Atlas.
- Docker sandbox mode runs code in the `codesyncx-runner` image.

See [docs/ec2-deployment.md](docs/ec2-deployment.md) for the full AWS EC2 deployment runbook.

Backend health check:

```text
http://localhost:5000/health
http://localhost:5000/health/redis
```

## System Design Infrastructure

Code execution is queued through Redis/BullMQ and processed by a dedicated worker. The worker can run in local mode for development or Docker sandbox mode for isolated execution.

See [docs/system-design-infra.md](docs/system-design-infra.md) for Redis setup, worker commands, Docker sandbox mode, rate limiting, and Socket.IO Redis adapter details.

## Supported Languages

The current compiler API supports:

- C++
- Java
- Python

## Known Limitations

- Docker sandbox execution requires Docker and the `codesyncx-runner` image.
- Collaborative room state is in memory today; persistent room recovery is planned.
- GitHub upload currently targets the `CodeSync` repository.
