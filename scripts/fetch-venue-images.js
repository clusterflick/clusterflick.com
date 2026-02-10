/* eslint-disable */
const fs = require("node:fs");
const fsp = require("node:fs").promises;
const path = require("node:path");
const { pipeline } = require("node:stream/promises");
const { Readable } = require("node:stream");
const { load } = require("cheerio");
const sharp = require("sharp");
const { getAllCinemaAttributes } = require("scripts/cinemas");

const OUTPUT_DIR = path.join(__dirname, "..", "public", "images", "venues");
const DELAY_MS = 1000;
const DEBUG = process.argv.includes("--debug");

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

function getExtensionFromContentType(contentType) {
  const map = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
    "image/x-icon": ".ico",
    "image/vnd.microsoft.icon": ".ico",
  };
  return map[contentType] || ".jpg";
}

const MIN_FILE_SIZE = 1024; // 1KB — skip placeholder/tracking pixels
const MIN_IMAGE_SIZE = 128;
const MAX_IMAGE_SIZE = 1024;

function extractBestIcoPng(filePath) {
  const buf = fs.readFileSync(filePath);
  if (
    buf.length < 6 ||
    buf[0] !== 0 ||
    buf[1] !== 0 ||
    buf.readUInt16LE(2) !== 1
  )
    return null;

  const count = buf.readUInt16LE(4);
  let best = null;
  let bestPixels = 0;

  for (let i = 0; i < count; i++) {
    const off = 6 + i * 16;
    if (off + 16 > buf.length) break;
    const w = buf[off] || 256;
    const h = buf[off + 1] || 256;
    const size = buf.readUInt32LE(off + 8);
    const dataOff = buf.readUInt32LE(off + 12);
    if (w * h > bestPixels && dataOff + size <= buf.length) {
      bestPixels = w * h;
      best = { size, dataOff };
    }
  }

  if (!best) return null;

  const data = buf.subarray(best.dataOff, best.dataOff + best.size);
  // Only extract entries that contain embedded PNG data
  if (
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47
  ) {
    return data;
  }

  return null;
}

function getImageDimensions(filePath) {
  const buf = fs.readFileSync(filePath);

  // ICO: header at bytes 4-5 = count, then 16-byte entries
  if (
    buf.length >= 6 &&
    buf[0] === 0 &&
    buf[1] === 0 &&
    buf.readUInt16LE(2) === 1
  ) {
    const count = buf.readUInt16LE(4);
    let max = 0;
    for (let i = 0; i < count; i++) {
      const offset = 6 + i * 16;
      if (offset + 16 > buf.length) break;
      const w = buf[offset] || 256;
      const h = buf[offset + 1] || 256;
      max = Math.max(max, w, h);
    }
    return { width: max, height: max };
  }

  // PNG: width/height at bytes 16-23
  if (buf.length >= 24 && buf[0] === 0x89 && buf[1] === 0x50) {
    return {
      width: buf.readUInt32BE(16),
      height: buf.readUInt32BE(20),
    };
  }

  // JPEG: scan for SOF marker
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1];
      // SOF0, SOF1, SOF2
      if (marker >= 0xc0 && marker <= 0xc2) {
        return {
          height: buf.readUInt16BE(i + 5),
          width: buf.readUInt16BE(i + 7),
        };
      }
      const len = buf.readUInt16BE(i + 2);
      i += 2 + len;
    }
  }

  // WebP: RIFF header, "WEBP" at byte 8, VP8 chunk
  if (
    buf.length >= 30 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    if (buf.toString("ascii", 12, 16) === "VP8 " && buf.length >= 30) {
      return {
        width: buf.readUInt16LE(26) & 0x3fff,
        height: buf.readUInt16LE(28) & 0x3fff,
      };
    }
    if (buf.toString("ascii", 12, 18) === "VP8L" && buf.length >= 25) {
      const bits = buf.readUInt32LE(21);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }
  }

  return null;
}

function resolveUrl(imageUrl, baseUrl) {
  try {
    return new URL(imageUrl, baseUrl).href;
  } catch {
    return null;
  }
}

async function fetchPage(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

function extractImageCandidates(html, baseUrl) {
  const $ = load(html);
  const candidates = [];
  const seen = new Set();

  function add(url, source) {
    if (!url || seen.has(url)) return;
    seen.add(url);
    candidates.push({ url, source });
  }

  function getImgSrc(el) {
    return (
      $(el).attr("src") ||
      $(el).attr("data-src") ||
      $(el).attr("data-lazy-src") ||
      ($(el).attr("srcset") || "").split(",")[0]?.trim()?.split(/\s+/)[0] ||
      null
    );
  }

  // 1. Icon/profile-sized sources first (most likely to be a brand image)
  const iconSelectors = [
    'link[rel="apple-touch-icon"][sizes="180x180"]',
    'link[rel="apple-touch-icon"][sizes="152x152"]',
    'link[rel="apple-touch-icon"]',
    'link[rel="apple-touch-icon-precomposed"]',
    'link[rel="icon"][sizes="192x192"]',
    'link[rel="icon"][sizes="128x128"]',
    'meta[name="msapplication-TileImage"]',
    'link[rel="icon"][type="image/png"]',
    'link[rel="icon"][type="image/svg+xml"]',
    'link[rel="icon"][sizes="96x96"]',
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
  ];

  for (const selector of iconSelectors) {
    const el = $(selector).first();
    if (!el.length) continue;
    const value = el.attr("content") || el.attr("href");
    if (!value) continue;
    add(resolveUrl(value, baseUrl), selector);
  }

  // 2. JSON-LD structured data — look for logo
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html());
      const items = data["@graph"] || [data];
      for (const item of items) {
        const logoUrl =
          (typeof item.logo === "string" && item.logo) ||
          (item.logo && item.logo.url) ||
          (typeof item.image === "string" && item.image) ||
          (item.image && item.image.url);
        if (logoUrl) add(resolveUrl(logoUrl, baseUrl), "JSON-LD logo");
      }
    } catch {
      // ignore
    }
  });

  // 3. Body <img> tags with "logo" in src, alt, or class
  const checkLogoImg = (el, source) => {
    const imgSrc = getImgSrc(el);
    const src = (imgSrc || "").toLowerCase();
    const alt = ($(el).attr("alt") || "").toLowerCase();
    const cls = ($(el).attr("class") || "").toLowerCase();
    const elId = ($(el).attr("id") || "").toLowerCase();
    if (
      src.includes("logo") ||
      alt.includes("logo") ||
      cls.includes("logo") ||
      elId.includes("logo")
    ) {
      if (imgSrc) add(resolveUrl(imgSrc, baseUrl), source);
    }
  };

  $("img").each((_, el) => checkLogoImg(el, "body img[logo]"));

  // 3a. <noscript> content (Cheerio treats it as text, so re-parse it)
  $("noscript").each((_, el) => {
    const inner = $(el).text();
    if (!inner) return;
    const $ns = load(inner);
    $ns("img").each((_, imgEl) => checkLogoImg(imgEl, "noscript img[logo]"));
  });

  // 4. Header/nav <img> — first image in header or nav is often the logo
  const headerImg = $("header img, nav img, .header img, .navbar img").first();
  if (headerImg.length) {
    const imgSrc = getImgSrc(headerImg[0]);
    if (imgSrc) add(resolveUrl(imgSrc, baseUrl), "header/nav img");
  }

  // 5. Large/fallback sources — og:image and twitter:image (often banners, not icons)
  const largeSelectors = [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'meta[name="twitter:image:src"]',
    'meta[property="og:image:url"]',
    'link[rel="image_src"]',
  ];

  for (const selector of largeSelectors) {
    const el = $(selector).first();
    if (!el.length) continue;
    const value = el.attr("content") || el.attr("href");
    if (!value) continue;
    add(resolveUrl(value, baseUrl), selector);
  }

  return candidates;
}

async function getWellKnownCandidates(baseUrl) {
  const paths = [
    "/apple-touch-icon.png",
    "/favicon-192x192.png",
    "/favicon.ico",
  ];
  const results = [];

  for (const p of paths) {
    try {
      const url = new URL(p, baseUrl).href;
      const response = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.startsWith("image/")) {
          results.push({ url, source: `well-known ${p}` });
        }
      }
    } catch {
      // ignore
    }
  }
  return results;
}

async function getUnavatarCandidates(socials) {
  if (!socials) return [];

  const attempts = [
    socials.instagram && { platform: "instagram", username: socials.instagram },
    socials.twitter && { platform: "x", username: socials.twitter },
    socials.letterboxd && {
      platform: "letterboxd",
      username: socials.letterboxd,
    },
  ].filter(Boolean);

  const results = [];
  for (const { platform, username } of attempts) {
    try {
      const url = `https://unavatar.io/${platform}/${username}`;
      const response = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
      });
      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.startsWith("image/")) {
          results.push({ url, source: `unavatar ${platform}/${username}` });
        }
      }
    } catch {
      // ignore
    }
  }
  return results;
}

async function downloadImage(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Image HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Not an image: ${contentType}`);
  }

  return {
    body: response.body,
    extension: getExtensionFromContentType(contentType.split(";")[0].trim()),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async function () {
  const allAttributes = getAllCinemaAttributes();

  // Deduplicate by domain — group venues share the same website
  const downloadPlan = new Map(); // domain -> { domain }
  const venueMapping = []; // { id, domain }

  for (const attr of allAttributes) {
    const { id, domain, socials, groupName } = attr;
    if (!domain) {
      venueMapping.push({ id, domain: null });
      continue;
    }
    if (!downloadPlan.has(domain)) {
      const safeName = groupName
        ? groupName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
        : new URL(domain).hostname.replace(/^www\./, "");
      downloadPlan.set(domain, { domain, socials, safeName });
    }
    venueMapping.push({ id, domain });
  }

  const noDomain = venueMapping.filter((v) => v.domain === null);
  const withDomain = venueMapping.filter((v) => v.domain !== null);
  const uniqueDownloads = downloadPlan.size;

  console.log(`\n${colors.bright}Venue Image Fetcher${colors.reset}`);
  console.log(`${colors.dim}${"─".repeat(60)}${colors.reset}`);
  console.log(`  Total venues:       ${allAttributes.length}`);
  console.log(`  With domain:        ${withDomain.length}`);
  if (noDomain.length > 0) {
    console.log(
      `  No domain:          ${noDomain.length}${colors.dim} (skipped)${colors.reset}`,
    );
  }
  console.log(`  Unique sites:       ${uniqueDownloads}`);
  console.log(`${colors.dim}${"─".repeat(60)}${colors.reset}\n`);

  await fsp.mkdir(OUTPUT_DIR, { recursive: true });

  // Download images from each unique domain
  const downloaded = new Map(); // domain -> extension
  let successCount = 0;
  let failCount = 0;
  const failures = [];
  const warnings = [];
  let current = 0;

  for (const [domain] of downloadPlan) {
    current++;
    const pad = String(uniqueDownloads).length;
    const progress = `[${String(current).padStart(pad, " ")}/${uniqueDownloads}]`;

    const { safeName } = downloadPlan.get(domain);

    // Check if already downloaded from a previous run
    const existingFiles = fs
      .readdirSync(OUTPUT_DIR)
      .filter(
        (f) =>
          f.startsWith(`${safeName}.`) &&
          !f.includes("--") &&
          !f.endsWith(".noimage"),
      );

    if (existingFiles.length > 0) {
      const ext = path.extname(existingFiles[0]);
      downloaded.set(domain, { ext, safeName });
      successCount++;
      console.log(
        `${colors.gray}${progress} ${safeName} — already exists${colors.reset}`,
      );
      continue;
    }

    // Skip domains that previously failed (delete .noimage file to retry)
    const noImageMarker = path.join(OUTPUT_DIR, `${safeName}.noimage`);
    if (fs.existsSync(noImageMarker)) {
      failCount++;
      failures.push({ domain: safeName, error: "No image found (cached)" });
      console.log(
        `${colors.gray}${progress} ${safeName} — no image (cached)${colors.reset}`,
      );
      continue;
    }

    const { socials } = downloadPlan.get(domain);
    try {
      const html = await fetchPage(domain);
      if (DEBUG) {
        const debugHtmlPath = path.join(OUTPUT_DIR, `_debug-${safeName}.html`);
        fs.writeFileSync(debugHtmlPath, html);
        console.log(
          `     ${colors.dim}HTML dumped to ${debugHtmlPath}${colors.reset}`,
        );
        console.log(
          `     ${colors.dim}HTML length: ${html.length} chars${colors.reset}`,
        );
        const logoMatch = html.match(/logo\.[a-z]+/gi);
        console.log(
          `     ${colors.dim}Raw "logo.*" in HTML: ${logoMatch ? logoMatch.join(", ") : "none"}${colors.reset}`,
        );
        const $ = load(html);
        const allImgs = $("img").length;
        const logoImgs = $("img").filter((_, el) => {
          const s = ($(el).attr("src") || "").toLowerCase();
          const a = ($(el).attr("alt") || "").toLowerCase();
          const c = ($(el).attr("class") || "").toLowerCase();
          const i = ($(el).attr("id") || "").toLowerCase();
          return (
            s.includes("logo") ||
            a.includes("logo") ||
            c.includes("logo") ||
            i.includes("logo")
          );
        }).length;
        console.log(
          `     ${colors.dim}Cheerio: ${allImgs} <img> total, ${logoImgs} with "logo"${colors.reset}`,
        );
        $("img").each((_, el) => {
          const src = $(el).attr("src") || $(el).attr("data-src") || "";
          const cls = $(el).attr("class") || "";
          if (src || cls)
            console.log(
              `       ${colors.dim}<img src="${src}" class="${cls}">${colors.reset}`,
            );
        });
      }
      const siteCandidates = [
        ...extractImageCandidates(html, domain),
        ...(await getWellKnownCandidates(domain)),
      ];

      let saved = false;
      let oversizedFallback = null;
      let svgFallback = null;

      const processBatch = async (candidates) => {
        for (const candidate of candidates) {
          let extension, filePath, filename;
          try {
            const result = await downloadImage(candidate.url);
            extension = result.extension;
            filename = `${safeName}${extension}`;
            filePath = path.join(OUTPUT_DIR, filename);
            await pipeline(
              Readable.fromWeb(result.body),
              fs.createWriteStream(filePath),
            );
          } catch (err) {
            if (DEBUG)
              console.log(
                `       ${colors.dim}✗ ${candidate.url} — ${err.message}${colors.reset}`,
              );
            continue; // try next candidate
          }

          // Reject tiny files (placeholders, tracking pixels)
          const isFallbackFile =
            (oversizedFallback && filePath === oversizedFallback.filePath) ||
            (svgFallback && filePath === svgFallback.filePath);
          const fileSize = fs.statSync(filePath).size;
          if (fileSize < MIN_FILE_SIZE) {
            if (DEBUG)
              console.log(
                `       ${colors.dim}✗ ${filename} — too small (${fileSize}b)${colors.reset}`,
              );
            if (!isFallbackFile && fs.existsSync(filePath))
              fs.unlinkSync(filePath);
            continue;
          }

          // SVG — remember as fallback but prefer raster images
          if (extension === ".svg") {
            if (!svgFallback) {
              if (DEBUG)
                console.log(
                  `       ${colors.dim}~ ${filename} — SVG fallback (${fileSize}b)${colors.reset}`,
                );
              svgFallback = { extension, filePath, filename };
            } else {
              if (DEBUG)
                console.log(
                  `       ${colors.dim}✗ ${filename} — duplicate SVG${colors.reset}`,
                );
              if (filePath !== svgFallback.filePath && fs.existsSync(filePath))
                fs.unlinkSync(filePath);
            }
            continue;
          }

          const dims = getImageDimensions(filePath);
          const maxDim = dims ? Math.max(dims.width, dims.height) : null;

          // Reject images that are too small
          if (maxDim !== null && maxDim < MIN_IMAGE_SIZE) {
            if (DEBUG)
              console.log(
                `       ${colors.dim}✗ ${filename} — too small (${maxDim}px)${colors.reset}`,
              );
            if (!isFallbackFile && fs.existsSync(filePath))
              fs.unlinkSync(filePath);
            continue;
          }

          // Oversized — remember as fallback but keep looking for something better
          if (maxDim !== null && maxDim > MAX_IMAGE_SIZE) {
            if (!oversizedFallback) {
              if (DEBUG)
                console.log(
                  `       ${colors.dim}~ ${filename} — oversized fallback (${dims.width}x${dims.height})${colors.reset}`,
                );
              oversizedFallback = { extension, filePath, filename, dims };
            } else {
              if (DEBUG)
                console.log(
                  `       ${colors.dim}✗ ${filename} — duplicate oversized${colors.reset}`,
                );
              if (
                filePath !== oversizedFallback.filePath &&
                fs.existsSync(filePath)
              )
                fs.unlinkSync(filePath);
            }
            continue;
          }

          // Good size — use this one
          if (
            oversizedFallback &&
            oversizedFallback.filePath !== filePath &&
            fs.existsSync(oversizedFallback.filePath)
          )
            fs.unlinkSync(oversizedFallback.filePath);
          if (
            svgFallback &&
            svgFallback.filePath !== filePath &&
            fs.existsSync(svgFallback.filePath)
          )
            fs.unlinkSync(svgFallback.filePath);
          downloaded.set(domain, { ext: extension, safeName });
          successCount++;
          saved = true;
          console.log(
            `${colors.green}${progress} ${safeName} — saved ${filename}${colors.reset}`,
          );
          return; // stop processing this batch
        }
      };

      if (DEBUG) {
        console.log(
          `     ${colors.dim}Candidates (${siteCandidates.length}):${colors.reset}`,
        );
        for (const c of siteCandidates) {
          console.log(
            `       ${colors.dim}[${c.source}] ${c.url}${colors.reset}`,
          );
        }
      }

      await processBatch(siteCandidates);

      // Only try unavatar if we have absolutely nothing from the site
      if (!saved && !oversizedFallback && !svgFallback) {
        const unavatarCandidates = await getUnavatarCandidates(socials);
        if (DEBUG && unavatarCandidates.length > 0) {
          console.log(
            `     ${colors.dim}Trying unavatar (${unavatarCandidates.length}):${colors.reset}`,
          );
        }
        await processBatch(unavatarCandidates);
      }

      if (DEBUG) {
        console.log(
          `     ${colors.dim}Decision: saved=${saved} svg=${!!svgFallback} oversized=${!!oversizedFallback}${colors.reset}`,
        );
      }

      if (!saved && svgFallback) {
        // SVG logo preferred over oversized raster
        if (oversizedFallback && fs.existsSync(oversizedFallback.filePath))
          fs.unlinkSync(oversizedFallback.filePath);
        downloaded.set(domain, { ext: svgFallback.extension, safeName });
        successCount++;
        warnings.push({
          domain: safeName,
          dims: { width: "SVG", height: "SVG" },
        });
        console.log(
          `${colors.yellow}${progress} ${safeName} — saved ${svgFallback.filename} (SVG)${colors.reset}`,
        );
      } else if (!saved && oversizedFallback) {
        // No good-sized or SVG alternative — keep oversized with warning
        if (svgFallback && fs.existsSync(svgFallback.filePath))
          fs.unlinkSync(svgFallback.filePath);
        downloaded.set(domain, { ext: oversizedFallback.extension, safeName });
        successCount++;
        warnings.push({ domain: safeName, dims: oversizedFallback.dims });
        console.log(
          `${colors.yellow}${progress} ${safeName} — saved ${oversizedFallback.filename} (${oversizedFallback.dims.width}x${oversizedFallback.dims.height}, oversized)${colors.reset}`,
        );
      } else if (!saved) {
        throw new Error("No image found");
      }
    } catch (err) {
      failCount++;
      failures.push({ domain: safeName, error: err.message });
      fs.writeFileSync(path.join(OUTPUT_DIR, `${safeName}.noimage`), "");
      console.log(
        `${colors.red}${progress} ${safeName} — ${err.message}${colors.reset}`,
      );
    }

    await sleep(DELAY_MS);
  }

  // Post-process: convert ICO/WebP to PNG and resize oversized images
  const POST_PROCESS_MAX = 512;
  console.log(`\n${colors.bright}Post-processing images...${colors.reset}\n`);

  for (const [, entry] of downloaded) {
    const { ext, safeName } = entry;
    const filePath = path.join(OUTPUT_DIR, `${safeName}${ext}`);

    if (!fs.existsSync(filePath) || ext === ".svg") continue;

    const needsConvert = ext === ".ico" || ext === ".webp";
    let needsResize = false;

    try {
      const metadata = await sharp(filePath).metadata();
      needsResize =
        metadata.width > POST_PROCESS_MAX || metadata.height > POST_PROCESS_MAX;
    } catch {
      if (!needsConvert) continue;
    }

    if (!needsConvert && !needsResize) continue;

    const newExt = needsConvert ? ".png" : ext;
    const newFilePath = path.join(OUTPUT_DIR, `${safeName}${newExt}`);
    const tempPath = filePath + ".tmp";

    // ICO: extract embedded PNG since sharp often can't read ICO
    if (ext === ".ico") {
      const pngData = extractBestIcoPng(filePath);
      if (pngData) {
        fs.writeFileSync(newFilePath, pngData);
        if (filePath !== newFilePath) fs.unlinkSync(filePath);
        entry.ext = newExt;
        try {
          const meta = await sharp(newFilePath).metadata();
          if (meta.width > POST_PROCESS_MAX || meta.height > POST_PROCESS_MAX) {
            await sharp(newFilePath)
              .resize(POST_PROCESS_MAX, POST_PROCESS_MAX, {
                fit: "inside",
                withoutEnlargement: true,
              })
              .png()
              .toFile(tempPath);
            fs.renameSync(tempPath, newFilePath);
            console.log(
              `  ${colors.green}${safeName}${newExt} — .ico → .png, resized${colors.reset}`,
            );
          } else {
            console.log(
              `  ${colors.green}${safeName}${newExt} — .ico → .png${colors.reset}`,
            );
          }
        } catch {
          console.log(
            `  ${colors.green}${safeName}${newExt} — .ico → .png${colors.reset}`,
          );
        }
        continue;
      }
    }

    try {
      let img = sharp(filePath);
      if (needsResize) {
        img = img.resize(POST_PROCESS_MAX, POST_PROCESS_MAX, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }
      if (newExt === ".png") {
        img = img.png();
      } else if (ext === ".jpg") {
        img = img.jpeg();
      }
      await img.toFile(tempPath);

      if (filePath !== newFilePath) fs.unlinkSync(filePath);
      fs.renameSync(tempPath, newFilePath);
      entry.ext = newExt;

      const actions = [];
      if (needsConvert) actions.push(`${ext} → ${newExt}`);
      if (needsResize) actions.push("resized");
      console.log(
        `  ${colors.green}${safeName}${newExt} — ${actions.join(", ")}${colors.reset}`,
      );
    } catch (err) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      console.log(
        `  ${colors.red}${safeName}${ext} — failed: ${err.message}${colors.reset}`,
      );
    }
  }

  // Create per-venue copies
  console.log(`\n${colors.bright}Creating per-venue files...${colors.reset}\n`);

  let linkedCount = 0;
  let skippedCount = 0;

  for (const { id, domain } of venueMapping) {
    if (!domain || !downloaded.has(domain)) {
      skippedCount++;
      continue;
    }

    const { ext, safeName } = downloaded.get(domain);
    const sourceName = `${safeName}${ext}`;
    const destName = `${id}${ext}`;
    const destPath = path.join(OUTPUT_DIR, destName);

    const sourcePath = path.join(OUTPUT_DIR, sourceName);

    if (sourceName === destName || fs.existsSync(destPath)) {
      linkedCount++;
      continue;
    }

    if (!fs.existsSync(sourcePath)) {
      skippedCount++;
      continue;
    }

    try {
      await fsp.copyFile(sourcePath, destPath);
      linkedCount++;
    } catch (err) {
      console.log(
        `${colors.red}  Failed to copy for ${id}: ${err.message}${colors.reset}`,
      );
      skippedCount++;
    }
  }

  // Summary
  console.log(`${colors.dim}${"─".repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}Results${colors.reset}`);
  console.log(
    `  ${colors.green}Downloaded: ${successCount}/${uniqueDownloads} unique images${colors.reset}`,
  );
  if (warnings.length > 0) {
    console.log(
      `  ${colors.yellow}Oversized:  ${warnings.length}${colors.reset}`,
    );
    console.log();
    for (const { domain, dims } of warnings) {
      console.log(
        `  ${colors.yellow}- ${domain}: ${dims.width}x${dims.height}${colors.reset}`,
      );
    }
  }
  if (failCount > 0) {
    console.log(
      `  ${colors.red}Failed:     ${failCount}/${uniqueDownloads}${colors.reset}`,
    );
    console.log();
    for (const { domain, error } of failures) {
      console.log(`  ${colors.red}- ${domain}: ${error}${colors.reset}`);
    }
  }
  console.log(
    `\n  ${colors.cyan}Venue images created: ${linkedCount}${colors.reset}`,
  );
  if (skippedCount > 0) {
    console.log(`  ${colors.yellow}Skipped:    ${skippedCount}${colors.reset}`);
  }
  console.log(`\n  ${colors.dim}Output: ${OUTPUT_DIR}${colors.reset}\n`);
})();
