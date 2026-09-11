import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The O2 stands on the Greenwich Peninsula in{" "}
        <Link href="/london-cinemas/greenwich/">Greenwich</Link>, southeast
        London, under the tented roof of the former Millennium Dome. It bills
        itself as an entertainment destination rather than a single venue:
        alongside the two auditoriums sit bars, restaurants, outlet shopping and
        a run of attractions that includes a climb over the roof itself.
      </p>
      <p>
        Live shows are split between The O2 arena, which takes the arena-scale
        concerts, comedy and sport, and indigo at The O2, the smaller room next
        door. Film is not a regular fixture of either, but it arrives in the
        arena as live-to-picture events — a feature screened in full while an
        orchestra plays the score in the room.
      </p>
    </section>
  );
}

export const seoDescription =
  "arena and entertainment district on the Greenwich Peninsula";
export const seoHighlights =
  "live-to-picture orchestral film screenings, concerts, comedy and sport";

export default VenueBlurb;
