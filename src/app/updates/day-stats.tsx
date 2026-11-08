import StatsBand, { type StatsBandItem } from "@/components/stats-band";
import { getDayTotals } from "@/utils/get-updates";
import type { UpdateDay } from "@/utils/get-updates";
import {
  dateStringToLondonTimestamp,
  formatDateLong,
} from "@/utils/format-date";

/**
 * A day's scale at a glance, above its runs: the figures a reader would
 * otherwise add up from each run's summary line.
 *
 * Unlinked, because what they count is listed directly beneath. New venues
 * appear only on a day that had some, picked out in yellow as the rarer news;
 * a zero there would be a figure about nothing.
 */
export default function DayStats({ day }: { day: UpdateDay }) {
  const totals = getDayTotals(day);

  const items: StatsBandItem[] = [
    { id: "films", value: totals.newFilms, label: "New films" },
    { id: "showings", value: totals.showings, label: "New showings" },
    // In the label rather than a detail line: a figure with a detail sits
    // higher than its neighbours, and the band reads as a row of equals
    { id: "venues", value: totals.venuesUpdated, label: "Venues updated" },
  ];
  if (totals.newVenues > 0) {
    items.push({
      id: "new-venues",
      value: totals.newVenues,
      label: totals.newVenues === 1 ? "New venue" : "New venues",
      highlight: true,
    });
  }

  return (
    <StatsBand
      items={items}
      label={`Updates on ${formatDateLong(dateStringToLondonTimestamp(day.date))}`}
    />
  );
}
