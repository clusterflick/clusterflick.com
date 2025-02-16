const fs = require("node:fs");
const path = require("node:path");
const { compress, trimUndefinedRecursively } = require("compress-json");
const data = require("../combined-data/combined-data.json");

try {
  const outputPath = path.join(__dirname, "..", "public");
  const outputFilename = "combined-data.json";
  trimUndefinedRecursively(data);
  const compressed = JSON.stringify(compress(data));
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
  fs.writeFileSync(path.join(outputPath, outputFilename), compressed);
  console.log(
    `Data compressed and written to ${path.join(outputPath, outputFilename)}`,
  );
} catch (e) {
  throw e;
}
