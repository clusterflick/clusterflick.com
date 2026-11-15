/**
 * Imports every module the package exports, from the build, in plain Node:
 * what a Worker's bundler will see. Fails on a subpath the exports map can't
 * reach, or a module that needs the browser to load.
 */
import { existsSync, globSync, readFileSync } from "node:fs";

const { name } = JSON.parse(readFileSync("package.json", "utf8"));
const subpaths = new Set();
for (const file of globSync("dist/**/*.js")) {
  if (file.startsWith("dist/chunks/")) continue;
  const subpath = file.slice("dist/".length, -".js".length);
  // An .mjs source is exported under its own extension.
  const mjs = existsSync(`dist/${subpath}.d.mts`);
  subpaths.add(mjs ? `${subpath}.mjs` : subpath);
}

for (const subpath of [...subpaths].sort()) {
  const exported = await import(`${name}/${subpath}`);
  if (Object.keys(exported).length === 0) {
    throw new Error(`${subpath} exports nothing at run time`);
  }
}

const { CAPABILITY_IDS } = await import(`${name}/capabilities`);
if (!CAPABILITY_IDS.includes("assistantAccess")) {
  throw new Error("CAPABILITY_IDS doesn't list assistantAccess");
}
console.log(`Imported ${subpaths.size} subpaths of ${name} in Node`);
