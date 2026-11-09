import type { Movie } from "@/types";
import type { UserListEntry } from "./index";

export type ListProgress = { seen: number; total: number };

/** How many of a list's films (`tmdbIds`) are on the reader's Seen list. */
export function getListProgress(
  tmdbIds: readonly string[],
  seen: Record<Movie["id"], UserListEntry>,
): ListProgress {
  return {
    seen: tmdbIds.filter((id) => id in seen).length,
    total: tmdbIds.length,
  };
}
