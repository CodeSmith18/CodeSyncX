import { createClient } from "redis";

export const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

export const getRedisConnectionOptions = () => {
  const url = new URL(REDIS_URL);
  const options = {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    db: url.pathname ? Number(url.pathname.replace("/", "")) || 0 : 0,
  };

  if (url.protocol === "rediss:") {
    options.tls = {};
  }

  return options;
};

export const createRedisClient = (name) => {
  const client = createClient({
    url: REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
    },
  });

  client.on("error", (error) => {
    console.error(`[redis:${name}]`, error.message);
  });

  return client;
};
