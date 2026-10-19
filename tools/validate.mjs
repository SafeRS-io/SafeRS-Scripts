#!/usr/bin/env node
/* =========================================================================
   Pre-push check for SafeRS script repos. Catches what would fail (or be
   silently skipped by) the SDN build:
     - unreadable / invalid safers.plugin.json
     - missing, placeholder or malformed plugin id; duplicate ids
     - runtime other than lua
     - bundle entry or single-file artifact that doesn't exist
     - mem. / mem: calls in .lua files (refused by the SDN policy scan)
     - script.declareInfo version that disagrees with the manifest (warning)

     node tools/validate.mjs            # whole repo
   Node 18+, built-ins only. Exit code 1 on any error.
   ========================================================================= */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(process.argv[2] ?? '.');
const SKIP = new Set(['.git', 'node_modules', 'dist', 'build', 'out']);
const ID_RE = /^plg_[a-zA-Z0-9_-]+$/;

let errors = 0;
let warnings = 0;
const err = (where, msg) => { errors++; console.log(`::error file=${where}::${msg}`); };
const warn = (where, msg) => { warnings++; console.log(`::warning file=${where}::${msg}`); };
const rel = (p) => relative(ROOT, p).split('\\').join('/');

function walk(dir, visit) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, ent.name);
    if (ent.isDirectory()) { if (!SKIP.has(ent.name)) walk(abs, visit); continue; }
    visit(abs, ent.name);
  }
}

const manifests = [];
const luaFiles = [];
walk(ROOT, (abs, name) => {
  if (name === 'safers.plugin.json') manifests.push(abs);
  else if (name.endsWith('.lua')) luaFiles.push(abs);
});

if (!manifests.length) err('.', 'no safers.plugin.json found — every script folder needs one');

const seen = new Map();
for (const path of manifests) {
  const where = rel(path);
  const dir = join(path, '..');
  let m;
  try { m = JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, '')); }
  catch (e) { err(where, `invalid JSON: ${e.message}`); continue; }

  if (typeof m.id !== 'string' || !ID_RE.test(m.id)) err(where, 'id must be the store plugin id, e.g. "plg_1a2b3c4d"');
  else if (/REPLACE/i.test(m.id)) err(where, 'id is still the template placeholder — paste your plugin id from the store');
  else if (seen.has(m.id)) err(where, `id ${m.id} is also used by ${seen.get(m.id)}`);
  else seen.set(m.id, where);

  if (m.runtime !== 'lua') err(where, 'runtime must be "lua"');
  if (typeof m.version !== 'string' || !m.version.trim()) err(where, 'version is required, e.g. "1.0.0"');

  if (m.src !== undefined) {
    const src = resolve(dir, m.src);
    if (!existsSync(src) || !statSync(src).isDirectory()) err(where, `src "${m.src}" is not a folder`);
    else if (typeof m.entry !== 'string' || !m.entry) err(where, 'a bundle (src) needs "entry", e.g. "main.lua"');
    else if (!existsSync(join(src, m.entry))) err(where, `entry "${m.entry}" not found in ${rel(src) || '.'}`);
  } else if (m.artifact !== undefined) {
    const file = resolve(dir, m.artifact);
    if (!existsSync(file) || !statSync(file).isFile()) err(where, `artifact "${m.artifact}" not found`);
  } else {
    err(where, 'needs "src" + "entry" (bundle) or "artifact" (single file)');
  }

  // declareInfo version drift (warning only — the manifest is what the store shows)
  const entryFile = m.src !== undefined && m.entry ? resolve(dir, m.src, m.entry) : m.artifact ? resolve(dir, m.artifact) : null;
  if (entryFile && existsSync(entryFile) && typeof m.version === 'string') {
    const info = readFileSync(entryFile, 'utf8').match(/declareInfo\s*\{[^}]*?version\s*=\s*["']([^"']+)["']/s);
    if (info && info[1] !== m.version) warn(rel(entryFile), `declareInfo version "${info[1]}" differs from manifest version "${m.version}"`);
  }
}

// Exactly the text match the SDN build refuses — comments, strings and a
// local table that happens to be called `mem` included. Rename such tables.
for (const file of luaFiles) {
  readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, i) => {
    if (/\bmem\s*[.:]/.test(line)) err(`${rel(file)},line=${i + 1}`, '"mem." / "mem:" is refused by the SDN build (raw memory access); use the srs.* API, and rename any table called mem');
  });
}

console.log(`\n${manifests.length} script(s) checked: ${errors} error(s), ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);
