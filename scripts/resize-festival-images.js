/* eslint-disable */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "public", "images", "festivals");
const MAX = 512;

async function process() {
  const files = fs
    .readdirSync(DIR)
    .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));

  for (const file of files) {
    const filePath = path.join(DIR, file);
    const meta = await sharp(filePath).metadata();
    const w = meta.width;
    const h = meta.height;
    const needsResize = w > MAX || h > MAX;

    if (!needsResize) {
      console.log(`  ok       ${file} (${w}x${h})`);
      continue;
    }

    const ext = path.extname(file).toLowerCase();
    const tempPath = filePath + ".tmp";
    let img = sharp(filePath).resize(MAX, MAX, {
      fit: "inside",
      withoutEnlargement: true,
    });
    if (ext === ".png") {
      img = img.png();
    } else {
      img = img.jpeg({ quality: 90 });
    }
    await img.toFile(tempPath);
    fs.renameSync(tempPath, filePath);

    const newMeta = await sharp(filePath).metadata();
    console.log(
      `  resized  ${file} ${w}x${h} → ${newMeta.width}x${newMeta.height}`,
    );
  }
}

process().catch(console.error);
