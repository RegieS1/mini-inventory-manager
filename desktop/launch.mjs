import { spawn } from "node:child_process";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function serverIsUp() {
  return new Promise((resolve) => {
    const req = http.get("http://127.0.0.1:3000/login", (res) => {
      res.resume();
      resolve(res.statusCode !== undefined);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  let server = null;

  if (!(await serverIsUp())) {
    server = spawn("npm", ["run", "dev"], {
      cwd: root,
      shell: true,
      stdio: "inherit",
    });
    for (let attempt = 0; attempt < 60 && !(await serverIsUp()); attempt += 1) {
      await wait(1000);
    }
  }

  const electron = require("electron");
  const window = spawn(electron, [path.join(root, "desktop", "main.mjs")], {
    cwd: root,
    stdio: "inherit",
  });

  window.on("exit", (code) => {
    if (server) {
      server.kill();
    }
    process.exit(code ?? 0);
  });
}

main();
