# CodeSyncX System Design Infrastructure

This phase adds backend infrastructure for scalable execution and realtime operation:

- Redis-backed BullMQ execution queue
- dedicated execution worker
- optional Docker sandbox runtime
- API rate limiting
- optional Socket.IO Redis adapter for horizontal scaling

## Runtime Architecture

```text
React Client
  |
  | POST /compile/:lang
  v
Express API
  |
  | add job
  v
Redis + BullMQ
  |
  | process job
  v
Execution Worker
  |
  | local runner or docker sandbox
  v
Code Execution Result

React Client
  |
  | GET /compile/jobs/:jobId
  v
Express API -> Redis job status
```

Socket.IO still uses the existing room/event logic. When enabled, the Redis adapter only changes how events are distributed between backend instances.

## Local Redis

With Homebrew:

```bash
brew install redis
brew services start redis
redis-cli ping
```

Expected:

```text
PONG
```

With Docker:

```bash
docker compose up redis
```

## Environment

Add these to `backend/.env`:

```env
REDIS_URL=redis://127.0.0.1:6379
SOCKET_REDIS_ADAPTER_ENABLED=false
REDIS_RATE_LIMIT_ENABLED=false
EXECUTION_MODE=local
EXECUTION_TIMEOUT_MS=5000
EXECUTION_OUTPUT_LIMIT_BYTES=20000
EXECUTION_WORKER_CONCURRENCY=2
```

For Docker sandbox execution:

```env
EXECUTION_MODE=docker
EXECUTION_DOCKER_IMAGE=codesyncx-runner
EXECUTION_DOCKER_MEMORY=128m
EXECUTION_DOCKER_CPUS=0.5
EXECUTION_DOCKER_PIDS=64
```

For Redis-backed distributed rate limiting:

```env
REDIS_RATE_LIMIT_ENABLED=true
```

For horizontally scaled Socket.IO:

```env
SOCKET_REDIS_ADAPTER_ENABLED=true
```

## Running Locally

Start MongoDB and Redis.

Terminal 1:

```bash
npm run dev:backend
```

Terminal 2:

```bash
npm run dev:worker
```

Terminal 3:

```bash
npm run dev:client
```

Health checks:

```text
http://localhost:5000/health
http://localhost:5000/health/redis
```

## Compile API

Submit a job:

```http
POST /compile/python
Content-Type: application/json

{
  "code": "print(input())",
  "input": "hello"
}
```

Response:

```json
{
  "success": true,
  "jobId": "1",
  "status": "queued"
}
```

Poll result:

```http
GET /compile/jobs/1
```

Completed response:

```json
{
  "success": true,
  "job": {
    "id": "1",
    "status": "completed",
    "result": {
      "success": true,
      "stdout": "hello\n",
      "stderr": "",
      "executionTimeMs": 250,
      "runtime": "local"
    }
  }
}
```

## Docker Sandbox

Build the runner image:

```bash
docker build -t codesyncx-runner ./runner
```

The worker runs jobs with:

- `--network none`
- memory limit
- CPU limit
- PID limit
- timeout
- per-job temp directory
- output size cap
- automatic cleanup

## Rate Limits

Defaults:

```text
General API: 100 requests / 15 min
Auth:        10 requests / 15 min
Compile:    20 submissions / min
GitHub:     30 requests / hour
```

Compile polling is not counted against the compile submission limiter, but it is still covered by the general limiter.

## Socket.IO Redis Adapter

When `SOCKET_REDIS_ADAPTER_ENABLED=true`, multiple API instances can share room events through Redis.

The existing socket event names and handlers remain unchanged:

- `join`
- `joined`
- `code-change`
- `sync-code`
- `disconnected`

After enabling this, test host-to-guest and guest-to-host editor sync across two backend instances.
