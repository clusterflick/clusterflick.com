/**
 * Imports every module the package exports, from the build, in plain Node:
 * what a Worker's bundler will see. Fails on a subpath the exports map can't
 * reach, or a module that needs the browser to load.
 */
import { globSync, readFileSync } from "node:fs";

const { name, exports } = JSON.parse(readFileSync("package.json", "utf8"));
const subpaths = new Set(
  Object.keys(exports).filter((key) => !key.includes("*")),
);
for (const file of globSync("dist/**/*.js")) {
  if (file.startsWith("dist/chunks/")) continue;
  const subpath = `./${file.slice("dist/".length, -".js".length)}`;
  if (subpath.endsWith("/index")) continue; // reached by its directory
  subpaths.add(
    subpath === "./utils/movie-ratings" ? `${subpath}.mjs` : subpath,
  );
}

for (const subpath of [...subpaths].sort()) {
  const exported = await import(`${name}/${subpath.slice(2)}`);
  if (Object.keys(exported).length === 0) {
    // A types-only module builds to nothing to import; anything else is wrong.
    const declarations = readFileSync(`dist/${subpath.slice(2)}.d.ts`, "utf8");
    if (/export (const|function|class|enum)/.test(declarations)) {
      throw new Error(`${subpath} exports nothing at run time`);
    }
  }
}

const { getDefaultState } = await import(`${name}/filters`);
if (typeof getDefaultState() !== "object") {
  throw new Error("getDefaultState() didn't return a filter state");
}
console.log(`Imported ${subpaths.size} subpaths of ${name} in Node`);
