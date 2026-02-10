import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { runInNewContext } from "vm";

export type VenueAttributes = {
  id: string;
  name: string;
  domain: string;
  socials: {
    letterboxd: string | null;
    twitter: string | null;
    instagram: string | null;
  } | null;
  url: string;
  address: string;
  geo: { lat: number; lon: number };
  structure: "solo" | "group";
  type: string;
  groupName?: string;
  alternativeNames?: string[];
};

export function getVenueAttributes(venueId: string): VenueAttributes | null {
  const filePath = join(
    process.cwd(),
    "node_modules",
    "scripts",
    "cinemas",
    venueId,
    "attributes.js",
  );

  if (!existsSync(filePath)) {
    return null;
  }

  const content = readFileSync(filePath, "utf-8");
  const mod = { exports: {} as VenueAttributes };
  runInNewContext(content, { module: mod, exports: mod.exports });
  return mod.exports;
}
