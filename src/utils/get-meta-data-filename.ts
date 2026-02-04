import fs from "node:fs";
import path from "node:path";

function getMetaDataFilename() {
  const publicDirectory = path.join(process.cwd(), "public", "data");
  return fs
    .readdirSync(publicDirectory)
    .filter((file) => file.startsWith("data.meta"))[0];
}

export default getMetaDataFilename;
