#!/usr/bin/env node
/**
 * Smoke-test that VitePress dist serves OpenAPI + Postman (and does not 404).
 * Usage from apps/docs: pnpm test:static
 */
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, ".vitepress/dist");
const repoRoot = path.resolve(root, "../..");

const required = [
  "openapi.yaml",
  "postman/autlantic-billing.postman_collection.json",
  "favicon.svg",
  "api/openapi.html",
  "resources/postman.html",
];

for (const rel of required) {
  const full = path.join(dist, rel);
  if (!existsSync(full)) {
    console.error(`missing in dist: ${rel}`);
    console.error("Run: pnpm build (with vite.publicDir → apps/docs/public)");
    process.exit(1);
  }
}

function freePort() {
  return new Promise((resolve, reject) => {
    const s = createServer();
    s.listen(0, "127.0.0.1", () => {
      const addr = s.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      s.close(() => resolve(port));
    });
    s.on("error", reject);
  });
}

const port = await freePort();
const child = spawn(
  "pnpm",
  ["exec", "serve", dist, "-l", `tcp://127.0.0.1:${port}`],
  { stdio: ["ignore", "pipe", "pipe"], cwd: root, shell: false },
);

let ready = false;
for (let i = 0; i < 30; i++) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/`);
    if (res.status > 0) {
      ready = true;
      break;
    }
  } catch {
    await new Promise((r) => setTimeout(r, 200));
  }
}
if (!ready) {
  child.kill("SIGTERM");
  console.error("serve did not become ready");
  process.exit(1);
}

const checks = [
  { path: "/openapi.yaml", expect: (b) => b.startsWith("openapi:") },
  {
    path: "/postman/autlantic-billing.postman_collection.json",
    expect: (b) => b.includes("Autlantic Billing API"),
  },
  { path: "/favicon.svg", expect: (b) => b.includes("<svg") },
  { path: "/api/openapi", expect: (b) => b.includes("OpenAPI") && !b.includes("PAGE NOT FOUND") },
  {
    path: "/resources/postman",
    expect: (b) => b.includes("Postman") && !b.includes("PAGE NOT FOUND"),
  },
];

let failed = false;
try {
  for (const check of checks) {
    const res = await fetch(`http://127.0.0.1:${port}${check.path}`);
    const body = await res.text();
    const ok = res.ok && check.expect(body) && !body.includes("PAGE NOT FOUND");
    if (!ok) {
      console.error(`FAIL ${check.path} status=${res.status} sample=${body.slice(0, 120)}`);
      failed = true;
    } else {
      console.log(`ok ${check.path} status=${res.status} bytes=${body.length}`);
    }
  }
} finally {
  child.kill("SIGTERM");
}

if (failed) process.exit(1);
console.log("docs static smoke passed");
void repoRoot;
