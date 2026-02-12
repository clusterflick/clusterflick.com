import { http, HttpResponse, delay, passthrough } from "msw";
/**
 * MSW Handlers for Storybook
 *
 * For normal scenarios, requests pass through to the real data files in public/data.
 * For special scenarios (loading, error, empty), MSW intercepts and modifies responses.
 */

// Empty data responses
const emptyMetaData = {
  generatedAt: new Date().toISOString(),
  filenames: [],
  mapping: {},
  urlPrefixes: [],
  genres: {},
  people: {},
  venues: {},
};

const emptyMovieData = {};

// Default handlers - just pass through to real files
export const handlers = [
  // Let all data requests pass through to real files by default
  http.get("/data/*", () => passthrough()),
];

// Handlers for loading state - adds significant delay
export const loadingHandlers = [
  http.get("/data/*.meta.*.json", async () => {
    // Let metadata load quickly so UI shows, but delay movie data
    return passthrough();
  }),
  http.get("/data/data.*.json", async () => {
    // Add a very long delay to keep loading state visible
    await delay("infinite");
  }),
];

// Handlers for error state
export const errorHandlers = [
  http.get("/data/*", () => {
    return HttpResponse.json({ error: "Failed to load data" }, { status: 500 });
  }),
];

// Handlers for empty data state
export const emptyHandlers = [
  http.get("/data/*.meta.*.json", () => {
    return HttpResponse.json(emptyMetaData);
  }),
  http.get("/data/data.*.json", () => {
    return HttpResponse.json(emptyMovieData);
  }),
];

// Handlers for partial data - first few load immediately, rest are delayed
// This simulates the state where some movies are visible but more are loading
export const partialHandlers = [
  http.get("/data/*.meta.*.json", () => passthrough()),
  http.get("/data/data.0.*.json", () => passthrough()),
  http.get("/data/data.1.*.json", () => passthrough()),
  http.get("/data/data.*.json", async () => {
    // Add a long delay to remaining files to keep loading state visible
    await delay("infinite");
  }),
];
