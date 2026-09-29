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
 * Reserves only for a reader carrying the signed-in flag, so a stored height
 * outliving a sign-out reserves nothing. Storage can throw, and nothing here
 * is essential.
 */
export const WATCHLIST_ROW_RESERVATION_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(SIGNED_IN_FLAG_KEY)})){var h=parseInt(localStorage.getItem(${JSON.stringify(WATCHLIST_ROW_HEIGHT_KEY)}),10);if(h>0){var s=document.getElementById(${JSON.stringify(WATCHLIST_ROW_SLOT_ID)});s.style.setProperty("--reserved-height",h+"px");s.setAttribute("data-reserved","")}}}catch(e){}`;
