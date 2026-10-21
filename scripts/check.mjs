#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function fail(message) {
  failures.push(message);
}

function listFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const fullPath = join(directory, name);
    return statSync(fullPath).isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    fail(`${relative(root, file)}: ${error.message}`);
    return null;
  }
}

const manifest = readJson(join(root, "manifest.json"));
if (manifest) {
  const references = [
    manifest.background?.service_worker,
    manifest.action?.default_popup,
    ...Object.values(manifest.action?.default_icon || {}),
    ...Object.values(manifest.icons || {}),
    ...(manifest.content_scripts || []).flatMap((script) => [
      ...(script.js || []),
      ...(script.css || [])
    ]),
    `_locales/${manifest.default_locale}/messages.json`
  ].filter(Boolean);

  for (const reference of new Set(references)) {
    if (!existsSync(join(root, reference))) {
      fail(`manifest.json references missing file: ${reference}`);
    }
  }
}

for (const file of listFiles(root).filter(
  (candidate) =>
    candidate.endsWith(".json") &&
    !candidate.includes(`${join(root, ".git")}`) &&
    !candidate.includes(`${join(root, "dist")}`) &&
    !candidate.includes(`${join(root, "test-output")}`)
)) {
  readJson(file);
}

for (const file of listFiles(root).filter(
  (candidate) =>
    candidate.endsWith(".js") &&
    !candidate.includes(`${join(root, ".git")}`) &&
    !candidate.includes(`${join(root, "test-output")}`)
)) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8"
  });
  if (result.status !== 0) {
    fail(`${relative(root, file)}: ${(result.stderr || "").trim()}`);
  }
}

const i18nSource = readFileSync(join(root, "shared/i18n.js"), "utf8");
const context = {
  document: { documentElement: { lang: "en" } },
  navigator: { language: "en" }
};
vm.runInNewContext(i18nSource, context, { filename: "shared/i18n.js" });
if (!context.XShareI18n) {
  fail("shared/i18n.js did not expose XShareI18n");
} else {
  const { SUPPORTED, MESSAGES } = context.XShareI18n;
  const fallbackKeys = Object.keys(MESSAGES.en || {}).sort().join(",");
  for (const locale of SUPPORTED) {
    if (!MESSAGES[locale]) {
      fail(`i18n: missing locale ${locale}`);
    } else if (Object.keys(MESSAGES[locale]).sort().join(",") !== fallbackKeys) {
      fail(`i18n: ${locale} does not match the English key set`);
    }
  }
}

for (const localeDir of readdirSync(join(root, "_locales"))) {
  const file = join(root, "_locales", localeDir, "messages.json");
  const messages = existsSync(file) ? readJson(file) : null;
  if (!messages?.extName?.message || !messages?.extDescription?.message) {
    fail(`_locales/${localeDir}: missing extName or extDescription`);
  }
}

// Settings defaults must stay in sync across the service worker, the content
// script and the popup, or the font picker and toggles drift apart.
const defaultsOf = (file) => {
  const source = readFileSync(join(root, file), "utf8");
  const match = source.match(/DEFAULT_SETTINGS\s*=\s*\{([\s\S]*?)\};/) ||
    source.match(/DEFAULT[A-Z_]*\s*=\s*\{([\s\S]*?)\};/);
  if (!match) return null;
  return [...match[1].matchAll(/(\w+)\s*:/g)].map((entry) => entry[1]).sort().join(",");
};
const defaultSources = ["background.js", "content/content.js", "popup/popup.js"];
const defaultShapes = defaultSources.map((file) => [file, defaultsOf(file)]);
for (const [file, shape] of defaultShapes) {
  if (!shape) fail(`${file}: no default settings object found`);
  else if (shape !== defaultShapes[0][1]) {
    fail(`${file}: default settings keys differ from ${defaultShapes[0][0]}`);
  }
}

const buildCheck = spawnSync(
  process.execPath,
  [join(root, "scripts/build.mjs"), "--check"],
  { encoding: "utf8" }
);
if (buildCheck.status !== 0) {
  fail((buildCheck.stderr || buildCheck.stdout || "dist check failed").trim());
}

if (failures.length) {
  console.error(failures.map((message) => `- ${message}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Extension source and dist/ are valid.");
}

