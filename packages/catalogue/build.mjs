/**
 * The published build: every source file as its own module under dist/, so
 * each subpath the site imports exists for a Worker too, with the code they
 * share split into chunks rather than copied into each. Then the type
 * declarations, from tsc. The site never uses this: it compiles the source
 * itself (tsconfig.json's `paths`).
 */
import { execFileSync } from "node:child_process";
import { globSync, rmSync } from "node:fs";
import { build } from "esbuild";

rmSync("dist", { recursive: true, force: true });

const entryPoints = globSync("src/**/*.{ts,mjs}").filter(
  (file) => !file.endsWith(".test.ts"),
);

await build({
  entryPoints,
  outbase: "src",
  outdir: "dist",
  entryNames: "[dir]/[name]",
  chunkNames: "chunks/[name]-[hash]",
  bundle: true,
  splitting: true,
  format: "esm",
  platform: "neutral",
  target: "es2022",
  logLevel: "warning",
});

execFileSync("tsc", ["-p", "tsconfig.build.json"], { stdio: "inherit" });
console.log(`Built ${entryPoints.length} modules into dist/`);
