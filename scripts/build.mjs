#!/usr/bin/env node

import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const runtimeEntries = [
  "manifest.json",
  "background.js",
  "content",
  "popup",
  "shared",
  "_locales",
  "icons"
];
const checkOnly = process.argv.includes("--check");

function listFiles(directory) {
  if (!statSync(directory).isDirectory()) return [directory];
  return readdirSync(directory).flatMap((name) => {
    const fullPath = join(directory, name);
    return statSync(fullPath).isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

function expectedFiles() {
  return runtimeEntries.flatMap((entry) => listFiles(join(root, entry)));
}

function fail(message) {
  console.error(`Build check failed: ${message}`);
  process.exitCode = 1;
}

if (!checkOnly) {
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });
  for (const entry of runtimeEntries) {
    cpSync(join(root, entry), join(dist, entry), { recursive: true });
  }
  console.log(`Built dist/ from ${runtimeEntries.length} runtime entries.`);
} else {
  if (!existsSync(dist)) {
    fail("dist/ does not exist; run `node scripts/build.mjs`.");
  } else {
    const expected = new Map(
      expectedFiles().map((file) => [relative(root, file), file])
    );
    const actual = new Set(listFiles(dist).map((file) => relative(dist, file)));
    const mismatches = [];

    for (const [relativePath, sourcePath] of expected) {
      const distPath = join(dist, relativePath);
      if (!existsSync(distPath)) {
        mismatches.push(`missing ${relativePath}`);
      } else if (!readFileSync(sourcePath).equals(readFileSync(distPath))) {
        mismatches.push(`stale ${relativePath}`);
      }
      actual.delete(relativePath);
    }

    for (const extra of actual) {
      mismatches.push(`unexpected ${extra}`);
    }

    if (mismatches.length) {
      fail(`dist/ is out of date:\n  ${mismatches.join("\n  ")}`);
    } else {
      console.log("dist/ is up to date.");
    }
  }
}

