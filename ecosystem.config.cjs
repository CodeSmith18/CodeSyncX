module.exports = {
  apps: [
    {
      name: "codesyncx-api",
      cwd: "./backend",
      script: "index.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "codesyncx-worker",
      cwd: "./backend",
      script: "workers/executionWorker.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
