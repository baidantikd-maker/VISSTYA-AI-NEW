import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";

const dependency = (...segments) => path.resolve("node_modules", ...segments);

async function findOpenPort(start = 3000) {
  for (let port = start; port < start + 20; port += 1) {
    const isOpen = await new Promise(resolve => {
      const server = net.createServer();
      server.once("error", () => resolve(false));
      server.listen(port, () => server.close(() => resolve(true)));
    });
    if (isOpen) return port;
  }
  throw new Error(`No open port found between ${start} and ${start + 19}`);
}

const apiPort = await findOpenPort();
const apiUrl = `http://localhost:${apiPort}`;
console.log(`Starting API at ${apiUrl} and frontend at http://localhost:5173`);

const processes = [
  spawn(process.execPath, [dependency("tsx", "dist", "cli.mjs"), "watch", "server/_core/index.ts"], {
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "development", PORT: String(apiPort) },
  }),
  spawn(process.execPath, [dependency("vite", "bin", "vite.js"), "--port", "5173", "--strictPort"], {
    stdio: "inherit",
    env: { ...process.env, VITE_API_TARGET: apiUrl },
  }),
];

let stopping = false;
function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of processes) child.kill();
  process.exit(exitCode);
}

for (const child of processes) {
  child.on("error", error => {
    console.error("Failed to start development server:", error.message);
    stop(1);
  });
  child.on("exit", code => {
    if (!stopping) stop(code ?? 1);
  });
}

process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
