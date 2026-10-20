#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const release = join(root, "release");
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
const filename = `XShare-v${manifest.version}.zip`;
const archive = join(release, filename);
const checksumFile = `${archive}.sha256`;

execFileSync(process.execPath, [join(root, "scripts/build.mjs")], {
  stdio: "inherit"
});

if (!existsSync(join(dist, "manifest.json"))) {
  throw new Error("dist/manifest.json is missing");
}

rmSync(release, { recursive: true, force: true });
mkdirSync(release, { recursive: true });
execFileSync("zip", ["-qr", archive, ".", "-x", "*.DS_Store"], {
  cwd: dist
});

const digest = createHash("sha256").update(readFileSync(archive)).digest("hex");
writeFileSync(checksumFile, `${digest}  ${filename}\n`);

console.log(`Packaged ${archive}`);
console.log(`SHA-256 ${digest}`);
