import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Edami is a Lebanese bakery on Shacklewell Lane in{" "}
        <Link href="/london-cinemas/hackney/">Hackney</Link>, practically next
        door to the Shacklewell Arms. Manakish are baked to order at the
        counter, alongside pastries, Lebanese coffee and ayran.
      </p>
      <p>
        It is a small, bright room: a counter and a handful of round tables
        under Crittall windows. The bakery keeps daytime hours, so its evenings
        are free for others: outside organisers borrow the room after closing
        for screenings and talks.
      </p>
    </section>
  );
}

export const seoDescription = "Lebanese bakery on Shacklewell Lane in Hackney";
export const seoHighlights = "after-hours screenings and talks";

export default VenueBlurb;
