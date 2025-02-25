const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { compress, trimUndefinedRecursively } = require("compress-json");
const data = require("../combined-data/combined-data.json");

function hash(inputString) {
  const hash = crypto.createHash("sha256"); // You can change 'sha256' to 'md5', 'sha1', etc.
  hash.update(inputString);
  return hash.digest("hex").slice(0, 10);
}

try {
  const outputPath = path.join(__dirname, "..", "public");
  trimUndefinedRecursively(data);
  const compressed = JSON.stringify(compress(data));
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
  const outputFilename = `combined-data.${hash(compressed)}.json`;
  fs.writeFileSync(path.join(outputPath, outputFilename), compressed);
  console.log(
    `Data compressed and written to ${path.join(outputPath, outputFilename)}`,
  );
} catch (e) {
  throw e;
}
