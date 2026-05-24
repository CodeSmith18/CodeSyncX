import { createAdapter } from "@socket.io/redis-adapter";
import { createRedisClient } from "./redis.js";

export const configureSocketRedisAdapter = async (io) => {
  if (process.env.SOCKET_REDIS_ADAPTER_ENABLED !== "true") {
    console.log("[socket] Redis adapter disabled; using in-memory adapter");
    return;
  }

  const pubClient = createRedisClient("socket-pub");
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));

  console.log("[socket] Redis adapter enabled");
};
