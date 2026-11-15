/**
 * The published build, as the catalogue's: every source file as its own
 * module under dist/, with the code they share split into chunks rather than
 * copied into each. So there's one copy of what a module keeps, such as the
 * cached access token, and one `UpstreamError` for `instanceof` to know. Then
 * the type declarations, from tsc.
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
  // Its dependencies are installed beside it, as any package's are, rather
  // than copied into it.
  packages: "external",
  splitting: true,
  format: "esm",
  platform: "neutral",
  target: "es2022",
  logLevel: "warning",
});

execFileSync("tsc", ["-p", "tsconfig.build.json"], { stdio: "inherit" });
console.log(`Built ${entryPoints.length} modules into dist/`);
