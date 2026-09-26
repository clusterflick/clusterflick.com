// CARTO basemaps now require an API key on every tile request. It travels in
// the tile URL, so a static export hands it to every visitor regardless of
// where we keep it — an env var would buy secrecy it cannot deliver, only a
// build that breaks when the var is missing. Keep it here, in the open, where
// rotating it is a one-line change.
const CARTO_API_KEY = "cb1_30xh_1_b0b4cac1bf7ec6c476dfc87d";
export const CARTO_TILE_URL = `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`;
export const CARTO_SUBDOMAINS = "abcd";
export const CARTO_MAX_ZOOM = 20;
export const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Centre of London — fallback view before venue bounds are fitted.
export const LONDON_CENTRE: [number, number] = [51.5074, -0.1278];
export const DEFAULT_ZOOM = 11;
