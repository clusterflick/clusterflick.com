import fs from "node:fs";
import path from "node:path";

export default function getDataFilename() {
  const publicDirectory = path.join(process.cwd(), "public");
  const files = fs.readdirSync(publicDirectory);
  return files;
}
