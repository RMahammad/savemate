const path = require("node:path");

const root = path.resolve(__dirname);
const backendCwd = path.join(root, "apps", "backend");

module.exports = {
  apps: [
    {
      name: "savemate-backend",
      cwd: backendCwd,
      script: "pnpm",
      args: "dev",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      watch: false,
      env: {
        NODE_ENV: process.env.NODE_ENV ?? "production",

        // dotenv/config supports this; it lets you keep the .env in repo root
        // even though the backend process runs in apps/backend.
        DOTENV_CONFIG_PATH:
          process.env.DOTENV_CONFIG_PATH ?? path.join(root, ".env"),

        PORT: process.env.PORT ?? "4000",

        // Must be an absolute path on Ubuntu if you want persistence.
        UPLOADS_DIR: process.env.UPLOADS_DIR ?? "/var/lib/savemate/uploads",
      },
    },
  ],
};
