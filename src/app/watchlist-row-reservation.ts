import { SIGNED_IN_FLAG_KEY } from "@/lib/user-lists";

/**
 * The row appears only once the reader's lists and the cinema data have both
 * loaded, seconds after the page has painted, and it sits above every other
 * row. Arriving from nothing it would push the whole page down, so its slot
 * reserves the height the row last had, set by an inline script that runs
 * before paint. The height is stored after each render and cleared when the
 * row turns out empty, so a reader with nothing showing reserves nothing.
 *
 * The script also marks the slot `data-reserved`, which shows a spinner in
 * the reserved space until the row lands. Keyed to the reservation rather
 * than to loading, since a spinner in a slot with no height would itself
 * push the page down.
 */
export const WATCHLIST_ROW_SLOT_ID = "watchlist-row";
export const WATCHLIST_ROW_HEIGHT_KEY = "clusterflick-watchlist-row-height";

/**
 * "From Directors You Love", under it, arrives the same way and later still
 * (it needs the film details too), so it reserves its height the same way.
 */
export const DIRECTORS_ROW_SLOT_ID = "directors-row";
export const DIRECTORS_ROW_HEIGHT_KEY = "clusterflick-directors-row-height";

/**
 * The script reserving a row's slot. Reserves only for a reader carrying the
 * signed-in flag, so a stored height outliving a sign-out reserves nothing.
 * Storage can throw, and nothing here is essential.
 */
export function getRowReservationScript(slotId: string, heightKey: string) {
  return `try{if(localStorage.getItem(${JSON.stringify(SIGNED_IN_FLAG_KEY)})){var h=parseInt(localStorage.getItem(${JSON.stringify(heightKey)}),10);if(h>0){var s=document.getElementById(${JSON.stringify(slotId)});s.style.setProperty("--reserved-height",h+"px");s.setAttribute("data-reserved","")}}}catch(e){}`;
}

export const WATCHLIST_ROW_RESERVATION_SCRIPT = getRowReservationScript(
  WATCHLIST_ROW_SLOT_ID,
  WATCHLIST_ROW_HEIGHT_KEY,
);

export const DIRECTORS_ROW_RESERVATION_SCRIPT = getRowReservationScript(
  DIRECTORS_ROW_SLOT_ID,
  DIRECTORS_ROW_HEIGHT_KEY,
);

/** Stores a row's settled height for next time, or clears it when empty. */
export function storeRowHeight(heightKey: string, height: number) {
  try {
    if (height > 0) {
      localStorage.setItem(heightKey, String(height));
    } else {
      localStorage.removeItem(heightKey);
    }
  } catch {}
}
