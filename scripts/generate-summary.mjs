/**
 * Generates the editorial summary shown at the top of the discovery home page.
 *
 * Runs at build time AFTER `process-combined-data` and BEFORE `next build`.
 * It mines this week's screenings for the things a trusted London film editor
 * would actually flag — special formats and events (70mm, premieres, Q&As),
 * genuine one-off screenings, critically-loved hidden gems, films ending their
 * run — resolves each to a venue/date/rating, and hands that ranked candidate
 * set to Gemini with an adaptive prompt. Empty categories are omitted, and a
 * priority ladder means there is always something useful to say.
 *
 * If no GEMINI_API_KEY is set (e.g. PR CI) or the call fails, a deterministic
 * template walks the same ladder so the build always produces a valid file.
 *
 * Uses the same model + key as the Clusterflick data-pipeline scripts
 * (@google/generative-ai, gemini-2.5-flash-lite, GEMINI_API_KEY).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  getRating,
  EVERGREEN_MAX_FUTURE,
} from "../src/utils/movie-ratings.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "public", "data");
// Build-only artifact: read by the home page at build time and baked into the
// static HTML, never fetched by the client — so it lives outside public/ and is
// not shipped. Kept in sync with src/utils/get-editorial-summary.ts.
const OUTPUT_PATH = path.join(__dirname, "..", "editorial-summary.json");

const MODEL = "gemini-2.5-flash-lite";
// Retry Gemini a few times (it 503s under load) before falling back to template.
const AI_MAX_ATTEMPTS = 3;
const AI_RETRY_DELAY_MS = 30_000;
const DAY = 86_400_000;
const WINDOW_DAYS = 7;
const NEW_ADDITION_LOOKBACK_DAYS = 7;
// A film is "last chance" if its final non-sold-out showing is within this many
// days AND it's a limited run — a wide multiplex release "ending Sunday" is
// usually just the data horizon, not a genuine final chance.
const LAST_CHANCE_DAYS = 3;
const LAST_CHANCE_MAX_VENUES = 6;
const DEFAULT_CATEGORIES = new Set(["movie", "multiple-movies", "shorts"]);
const LONDON_TZ = "Europe/London";

// No single venue may supply more than this many of the venue-specific
// highlights, so the candidate set stays diverse across London's cinemas.
const GLOBAL_MAX_PER_VENUE = 3;

// Venue types that are ordinary cinemas; everything else (Bar, Museum, Cultural
// Institute, University, Park…) counts as an "unconventional" venue.
const CINEMA_TYPES = new Set(["Cinema", "Community Cinema", "Screening Room"]);

// getRating + the review-count floors and EVERGREEN_MAX_FUTURE are shared with
// the discovery helpers — see ../src/utils/movie-ratings.mjs.

// A film counts as an "acclaimed gem" if well-reviewed but showing at few venues.
const GEM_RATING_MIN = 0.76; // ~3.8/5 Letterboxd, 76% RT, 7.6 IMDb
const GEM_MAX_VENUES = 4;
const CLASSIC_MIN_AGE_YEARS = 15;
const NEW_RELEASE_MAX_AGE_DAYS = 60;
const YEAR_MS = 365.25 * DAY;

// Special formats / events, mined from movie + showing titles and performance
// notes. Higher weight = more special (a 70mm print trumps a generic IMAX show).
const EVENT_KINDS = [
  { re: /\b70\s?mm\b/i, w: 100, hook: "a 70mm print" },
  { re: /\b35\s?mm\b/i, w: 96, hook: "a 35mm print" },
  { re: /\b16\s?mm\b/i, w: 95, hook: "a 16mm print" },
  { re: /\bpremiere\b/i, w: 92, hook: "a premiere" },
  {
    re: /in attendance|in person|in conversation|live appearance/i,
    w: 90,
    hook: "with a guest in attendance",
  },
  { re: /q\s*&\s*a|\bq and a\b|\bq&a\b/i, w: 82, hook: "with a Q&A" },
  { re: /preview|sneak peek|first look/i, w: 76, hook: "a preview" },
  { re: /all.?night|all.?dayer|\bmarathon\b/i, w: 72, hook: "an all-nighter" },
  { re: /\b4k\b|restoration|restored/i, w: 66, hook: "a new restoration" },
  {
    re: /introduc|presented by|hosted by/i,
    w: 62,
    hook: "with an introduction",
  },
  { re: /anniversar/i, w: 56, hook: "an anniversary screening" },
  { re: /sing.?along/i, w: 52, hook: "a sing-along" },
  { re: /\bimax\b/i, w: 42, hook: "in IMAX" },
];
const CELLULOID_RE = /\b(70|35|16)\s?mm\b/i;

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function readData() {
  const metaFile = fs
    .readdirSync(DATA_DIR)
    .find((f) => f.startsWith("data.meta.") && f.endsWith(".json"));
  if (!metaFile) {
    throw new Error(`No data.meta.*.json found in ${DATA_DIR}`);
  }
  const meta = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, metaFile), "utf-8"),
  );
  const movies = {};
  for (const filename of meta.filenames) {
    Object.assign(
      movies,
      JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), "utf-8")),
    );
  }
  return { meta, movies };
}

/** Most common showing category, deprioritising "event" (mirrors getPrimaryCategory). */
function primaryCategory(movie) {
  const showings = Object.values(movie.showings ?? {});
  if (showings.length === 0) return "event";
  const counts = new Map();
  for (const s of showings)
    counts.set(s.category, (counts.get(s.category) || 0) + 1);
  const sorted = [...counts.entries()].sort(([, a], [, b]) => b - a);
  if (sorted[0][0] === "event" && sorted.length > 1) return sorted[1][0];
  return sorted[0][0];
}

function venueName(meta, venueId) {
  return meta.venues?.[venueId]?.name ?? null;
}

function venueType(meta, venueId) {
  return meta.venues?.[venueId]?.type ?? null;
}

function formatWhen(time) {
  return new Date(time).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: LONDON_TZ,
  });
}

function getReleaseTime(movie) {
  if (movie.releaseDate) {
    const t = Date.parse(movie.releaseDate);
    if (!Number.isNaN(t)) return t;
  }
  if (movie.year) {
    const y = Number.parseInt(movie.year, 10);
    if (!Number.isNaN(y)) return Date.UTC(y, 0, 1);
  }
  return null;
}

/** The strongest special-format/event tag across a film's upcoming showings. */
function detectEvent(movie, upcoming) {
  let best = null;
  for (const { perf, showing } of upcoming) {
    const text = `${movie.title}\n${showing?.title ?? ""}\n${perf.notes ?? ""}`;
    for (const kind of EVENT_KINDS) {
      if (kind.re.test(text) && (!best || kind.w > best.weight)) {
        best = { weight: kind.w, hook: kind.hook, perf, showing };
      }
    }
  }
  return best;
}

function computeSignals(meta, movies, now) {
  const windowEnd = now + (WINDOW_DAYS + 1) * DAY;
  const lastChanceDeadline = now + LAST_CHANCE_DAYS * DAY;
  const newCutoff = now - NEW_ADDITION_LOOKBACK_DAYS * DAY;

  const weekVenues = new Set();
  const dayCounts = new Map();
  let celluloidPerfs = 0;

  const eventCandidates = [];
  const oneOffCandidates = [];
  const endingCandidates = [];
  const unusualCandidates = [];
  const gemCandidates = [];
  const newlyAddedCandidates = [];
  const popularCandidates = [];

  for (const [id, movie] of Object.entries(movies)) {
    if (!DEFAULT_CATEGORIES.has(primaryCategory(movie))) continue;
    const matched = !movie.isUnmatched;

    // This week's performances, paired with their showing.
    const upcoming = [];
    for (const perf of movie.performances ?? []) {
      if (perf.time >= now && perf.time < windowEnd) {
        upcoming.push({ perf, showing: movie.showings?.[perf.showingId] });
      }
    }
    if (upcoming.length === 0) continue;

    const venueIds = new Set();
    for (const { perf, showing } of upcoming) {
      if (showing?.venueId) {
        venueIds.add(showing.venueId);
        weekVenues.add(showing.venueId);
      }
      const day = new Date(perf.time).toLocaleDateString("en-GB", {
        weekday: "short",
        timeZone: LONDON_TZ,
      });
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
      if (CELLULOID_RE.test(perf.notes ?? "")) celluloidPerfs++;
    }

    const rating = getRating(movie);
    const venueCount = venueIds.size;
    const allFuture = (movie.performances ?? []).filter((p) => p.time >= now);
    // Evergreen = a permanent, continuously-running fixture (e.g. a museum IMAX
    // attraction with 90+ future showings), not a curated screening. Never a
    // genuine "discovery", so it's excluded from the special highlights.
    const isEvergreen = allFuture.length > EVERGREEN_MAX_FUTURE;

    // The film's soonest showing this week — a real venue + date every candidate
    // can carry, so the model never borrows specifics from another film.
    const sortedUpcoming = [...upcoming].sort(
      (a, b) => a.perf.time - b.perf.time,
    );
    const rep = sortedUpcoming[0];
    const repVenue = venueName(meta, rep?.showing?.venueId);
    const repVenueId = rep?.showing?.venueId ?? null;
    const repWhen = rep ? formatWhen(rep.perf.time) : null;

    // Special format / event (permanent attractions excluded).
    const event = isEvergreen ? null : detectEvent(movie, upcoming);
    if (event) {
      eventCandidates.push({
        id,
        title: movie.title,
        hook: event.hook,
        weight: event.weight,
        venue: venueName(meta, event.showing?.venueId),
        venueId: event.showing?.venueId ?? null,
        when: formatWhen(event.perf.time),
        rating: rating?.text ?? null,
      });
    }

    // A worthwhile film at an unconventional, non-cinema venue (a bar, gallery,
    // cultural institute, museum, university and the like).
    if (matched && !isEvergreen && rating) {
      const unusual = upcoming.find((u) => {
        const type = venueType(meta, u.showing?.venueId);
        return type && !CINEMA_TYPES.has(type);
      });
      if (unusual) {
        unusualCandidates.push({
          id,
          title: movie.title,
          venue: venueName(meta, unusual.showing?.venueId),
          venueId: unusual.showing?.venueId ?? null,
          venueType: venueType(meta, unusual.showing?.venueId),
          when: formatWhen(unusual.perf.time),
          rating: rating.text,
          norm: rating.norm,
        });
      }
    }

    // One-off: the film's only future showing is this single one.
    if (matched && allFuture.length === 1) {
      const only = upcoming[0];
      oneOffCandidates.push({
        id,
        title: movie.title,
        venue: venueName(meta, only?.showing?.venueId),
        venueId: only?.showing?.venueId ?? null,
        when: formatWhen(allFuture[0].time),
        rating: rating?.text ?? null,
        norm: rating?.norm ?? 0,
      });
    }

    // Ending soon: a run (multiple future shows) whose final non-sold-out
    // showing is within 3 days.
    if (
      matched &&
      allFuture.length > 1 &&
      venueCount <= LAST_CHANCE_MAX_VENUES
    ) {
      const open = allFuture.filter((p) => !p.status?.soldOut);
      if (open.length > 0) {
        const finalTime = Math.max(...open.map((p) => p.time));
        if (finalTime <= lastChanceDeadline) {
          const finalShowing =
            movie.showings?.[open.find((p) => p.time === finalTime)?.showingId];
          endingCandidates.push({
            id,
            title: movie.title,
            finalWhen: formatWhen(finalTime),
            venueCount,
            venue: venueName(meta, finalShowing?.venueId),
            venueId: finalShowing?.venueId ?? null,
            rating: rating?.text ?? null,
          });
        }
      }
    }

    // Acclaimed gem: well-reviewed but low-profile.
    if (
      matched &&
      !isEvergreen &&
      rating &&
      rating.norm >= GEM_RATING_MIN &&
      venueCount <= GEM_MAX_VENUES
    ) {
      gemCandidates.push({
        id,
        title: movie.title,
        rating: rating.text,
        norm: rating.norm,
        venues: venueCount,
        venue: repVenue,
        venueId: repVenueId,
        when: repWhen,
      });
    }

    // Newly added this week, with an age label.
    const seenValues = Object.values(movie.showings ?? {})
      .map((s) => s.seen)
      .filter((s) => typeof s === "number");
    const earliestSeen = seenValues.length ? Math.min(...seenValues) : Infinity;
    const releaseTime = getReleaseTime(movie);
    if (matched && releaseTime !== null && earliestSeen >= newCutoff) {
      const ageMs = now - releaseTime;
      let kind = "back on the big screen";
      if (ageMs > CLASSIC_MIN_AGE_YEARS * YEAR_MS) kind = "a classic";
      else if (ageMs <= NEW_RELEASE_MAX_AGE_DAYS * DAY) kind = "a new release";
      newlyAddedCandidates.push({
        id,
        title: movie.title,
        kind,
        year: new Date(releaseTime).getUTCFullYear(),
        rating: rating?.text ?? null,
        earliestSeen,
      });
    }

    // Popular: showing widely.
    if (venueCount >= 2) {
      popularCandidates.push({
        id,
        title: movie.title,
        venueCount,
        score: venueCount * 3 + upcoming.length,
      });
    }
  }

  // Claim each film for a single highlight list, in priority order. A global
  // per-venue budget keeps one dominant cinema (e.g. the Prince Charles, which
  // runs most of London's celluloid) from monopolising the venue-specific
  // highlights, so the model has a venue-diverse set to draw from.
  const claimed = new Set();
  const venueUsage = new Map();
  const take = (list, n, sort, { capVenues = false } = {}) => {
    const out = [];
    for (const c of [...list].sort(sort)) {
      if (claimed.has(c.id)) continue;
      if (capVenues && c.venueId) {
        if ((venueUsage.get(c.venueId) ?? 0) >= GLOBAL_MAX_PER_VENUE) continue;
      }
      claimed.add(c.id);
      if (capVenues && c.venueId) {
        venueUsage.set(c.venueId, (venueUsage.get(c.venueId) ?? 0) + 1);
      }
      out.push(c);
      if (out.length >= n) break;
    }
    return out;
  };

  const events = take(eventCandidates, 8, (a, b) => b.weight - a.weight, {
    capVenues: true,
  });
  const oneOffs = take(oneOffCandidates, 8, (a, b) => b.norm - a.norm, {
    capVenues: true,
  });
  const endingSoon = take(
    endingCandidates,
    6,
    (a, b) => b.venueCount - a.venueCount,
    { capVenues: true },
  );
  // Take unusual-venue screenings before gems so a well-reviewed film at a bar or
  // gallery surfaces with its venue angle rather than as a generic cinema gem.
  const unusualVenues = take(unusualCandidates, 4, (a, b) => b.norm - a.norm, {
    capVenues: true,
  });
  const acclaimedGems = take(gemCandidates, 6, (a, b) => b.norm - a.norm, {
    capVenues: true,
  });
  const newlyAdded = take(
    newlyAddedCandidates,
    6,
    (a, b) => b.earliestSeen - a.earliestSeen,
  );
  const popular = take(popularCandidates, 6, (a, b) => b.score - a.score);

  const busiestDay =
    [...dayCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Link targets: every entity we put in front of the model, keyed by the exact
  // phrase it was given, so the renderer can linkify only confident matches to
  // canonical pages (the model never emits URLs itself).
  const links = [];
  const seenPhrase = new Set();
  const addLink = (phrase, target) => {
    if (!phrase) return;
    const key = phrase.toLowerCase();
    if (seenPhrase.has(key)) return;
    seenPhrase.add(key);
    links.push({ phrase, ...target });
  };
  for (const c of [
    ...events,
    ...oneOffs,
    ...endingSoon,
    ...unusualVenues,
    ...acclaimedGems,
    ...newlyAdded,
    ...popular,
  ]) {
    addLink(c.title, { movieId: c.id });
  }
  for (const c of [
    ...events,
    ...oneOffs,
    ...endingSoon,
    ...unusualVenues,
    ...acclaimedGems,
  ]) {
    if (c.venueId) addLink(c.venue, { venueId: c.venueId });
  }

  return {
    events,
    oneOffs,
    endingSoon,
    unusualVenues,
    acclaimedGems,
    newlyAdded,
    popular,
    shape: {
      venues: weekVenues.size,
      busiestDay,
      celluloidShowings: celluloidPerfs,
    },
    links,
  };
}

function buildPromptData(signals) {
  const clean = (arr, fn) => (arr.length ? arr.map(fn) : undefined);
  return {
    specialEventsAndFormats: clean(signals.events, (e) => ({
      film: e.title,
      hook: e.hook,
      venue: e.venue,
      when: e.when,
      rating: e.rating,
    })),
    oneOffScreenings: clean(signals.oneOffs, (o) => ({
      film: o.title,
      venue: o.venue,
      when: o.when,
      rating: o.rating,
    })),
    endingSoon: clean(signals.endingSoon, (e) => ({
      film: e.title,
      finalShowing: e.finalWhen,
      venue: e.venue,
      rating: e.rating,
    })),
    atUnconventionalVenues: clean(signals.unusualVenues, (u) => ({
      film: u.title,
      venue: u.venue,
      venueKind: u.venueType,
      when: u.when,
      rating: u.rating,
    })),
    acclaimedButLowProfile: clean(signals.acclaimedGems, (g) => ({
      film: g.title,
      rating: g.rating,
      venues: g.venues,
      venue: g.venue,
      when: g.when,
    })),
    newlyAdded: clean(signals.newlyAdded, (n) => ({
      film: n.title,
      what: n.kind,
      year: n.year,
      rating: n.rating,
    })),
    showingMostWidely: clean(signals.popular, (p) => ({
      film: p.title,
      venues: p.venueCount,
    })),
    weekShape: {
      venuesShowing: signals.shape.venues,
      busiestDay: signals.shape.busiestDay,
      celluloidShowings: signals.shape.celluloidShowings,
    },
  };
}

const SYSTEM_INSTRUCTION =
  "You are the trusted film editor for Clusterflick, which lists every screening across London's independent and chain cinemas. You write the short orientation at the top of the discovery page: the two or three things you'd genuinely tell a film-loving friend this week. Calm, specific, knowledgeable — never hyped, never a press release.";

function buildPrompt(signals) {
  const data = buildPromptData(signals);

  return `Write the editorial note for the top of Clusterflick's discovery page, using ONLY the data below (this week's London screenings). It is the reader's lead-in to the page, so you have room — one or two short paragraphs, whatever the data justifies. Don't pad.

What to surface, in priority order — lead with the most special thing actually present, then work down. Use only categories that have data; silently skip any that are missing:
1. The unmissable thing — a special format or event (a 70mm/35mm print, a premiere, a Q&A or guest in attendance).
2. A discovery — a critically-loved film that isn't showing everywhere (from acclaimedButLowProfile), with why it's worth it.
3. Scarcity — a genuine one-off screening, or a film whose run ends in the next couple of days.
4. Somewhere unexpected — if atUnconventionalVenues has a worthwhile entry, you may highlight a screening at a non-cinema space (a bar, gallery, cultural institute, museum), noting the kind of venue.
5. A light sense of the week's shape — only if genuinely notable (e.g. a strong week for celluloid). Never a bare statistic.

Always name films concretely and give each a real hook — the venue, the date, the format, the rating, or why it matters. If only popular/shape data is present, still give a useful one- or two-sentence orientation naming a couple of films.

CRITICAL — accuracy. Every fact must come from the data. A film's venue and date may ONLY be the ones listed inside that same film's own entry. Never attach a venue, date, format or rating taken from a different film's entry. If an entry has no venue or date, do not state one for that film — describe it without (e.g. "showing at a single venue"). Never invent or guess titles, venues, dates or ratings.

Spread your picks across different cinemas where the data allows — don't centre the whole note on one venue, even if it has several entries. Aim to mention two or three different cinemas.

Style: plain prose, British English, calm and understated. No greetings or openers like "Right then" or "This week, London film fans". No exclamation marks, no hype, no markdown, no headings, no emoji, no lists.

Data:
${JSON.stringify(data, null, 2)}`;
}

function buildTemplateSummary(signals) {
  const sentences = [];

  const event = signals.events[0];
  if (event) {
    const where = [event.venue, event.when].filter(Boolean).join(" on ");
    sentences.push(
      `The week's pick is ${event.hook} of ${event.title}${where ? ` at ${where}` : ""}.`,
    );
  }

  const gem = signals.acclaimedGems.find((g) => g.title !== event?.title);
  if (gem) {
    let where = "";
    if (gem.venues === 1 && gem.venue) where = ` at ${gem.venue}`;
    else if (gem.venues > 1) where = ` at ${gem.venues} venues`;
    sentences.push(
      `For a quieter discovery, ${gem.title} is well worth catching${where} (${gem.rating}).`,
    );
  }

  const taken = new Set([event?.title, gem?.title].filter(Boolean));
  const unusual = signals.unusualVenues.find((u) => !taken.has(u.title));
  if (unusual) {
    taken.add(unusual.title);
    const when = unusual.when ? ` on ${unusual.when}` : "";
    sentences.push(
      `Somewhere different, ${unusual.title} is showing at ${unusual.venue}${when}.`,
    );
  }

  const oneOff = signals.oneOffs.find((o) => !taken.has(o.title));
  const ending = signals.endingSoon.find((e) => !taken.has(e.title));
  if (oneOff) {
    const where = [oneOff.venue, oneOff.when].filter(Boolean).join(" on ");
    sentences.push(
      `${oneOff.title} screens just once this week${where ? `, at ${where}` : ""}.`,
    );
  } else if (ending) {
    sentences.push(
      `${ending.title} is in its final days, ending ${ending.finalWhen}.`,
    );
  }

  if (sentences.length === 0) {
    const popular = signals.popular[0];
    if (popular) {
      sentences.push(
        `${popular.title} is showing most widely this week, at ${popular.venueCount} venues across London.`,
      );
    } else {
      return "Discover what's showing across London's cinemas — from the films playing most widely to independent gems.";
    }
  }

  return sentences.join(" ");
}

/** Strip any stray markdown the model adds despite instructions. */
function sanitize(text) {
  return text
    .replace(/[*`]/g, "") // bold/italic/code markers
    .replace(/^#+\s*/gm, "") // heading markers
    .replace(/\n{3,}/g, "\n\n") // collapse extra blank lines
    .trim();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateAiSummary(signals) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: { temperature: 0.4, maxOutputTokens: 700 },
  });
  const prompt = buildPrompt(signals);

  // Gemini occasionally 503s under load; retry a few times before giving up so
  // a transient hiccup doesn't drop us to the template.
  let lastError;
  for (let attempt = 1; attempt <= AI_MAX_ATTEMPTS; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = sanitize(result.response.text().trim());
      if (!text) throw new Error("Empty response from Gemini");
      return text;
    } catch (error) {
      lastError = error;
      if (attempt < AI_MAX_ATTEMPTS) {
        console.warn(
          `⚠ Gemini attempt ${attempt}/${AI_MAX_ATTEMPTS} failed (${error.message}); retrying in ${AI_RETRY_DELAY_MS / 1000}s…`,
        );
        await sleep(AI_RETRY_DELAY_MS);
      }
    }
  }
  throw lastError;
}

async function main() {
  loadEnv();
  const { meta, movies } = readData();
  const signals = computeSignals(meta, movies, Date.now());

  let text;
  let source;
  if (process.env.GEMINI_API_KEY) {
    try {
      text = await generateAiSummary(signals);
      source = "ai";
      console.log("✓ Generated editorial summary via Gemini");
    } catch (error) {
      text = buildTemplateSummary(signals);
      source = "template";
      console.warn(
        `⚠ Gemini failed after ${AI_MAX_ATTEMPTS} attempts (${error.message}); using template fallback`,
      );
    }
  } else {
    text = buildTemplateSummary(signals);
    source = "template";
    console.log("ℹ No GEMINI_API_KEY set; using template fallback");
  }

  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(
      { generatedAt: meta.generatedAt, source, text, links: signals.links },
      null,
      2,
    ),
  );
  console.log(`✓ Wrote ${path.relative(process.cwd(), OUTPUT_PATH)}`);
}

main().catch((error) => {
  console.error("Failed to generate summary:", error);
  process.exit(1);
});
