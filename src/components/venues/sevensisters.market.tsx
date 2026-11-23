import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Seven Sisters Market sits on Tottenham High Road, directly opposite
        Seven Sisters station in{" "}
        <Link href="/london-cinemas/haringey/">Haringey</Link>, and bills itself
        as &quot;London&apos;s home of Latin American and World flavour, culture
        and community&quot;. Known to many as the Latin Village, it grew out of
        Wards Corner, where Wards Stores opened in an Edwardian landmark in 1901
        and an indoor market took over after the shop closed in 1972.
      </p>
      <p>
        Today it runs as an indoor and an outdoor market of around 40 stalls,
        with live music, dancing and seasonal celebrations through the year.
        Film gets on through its community space, &quot;a flexible urban room on
        the high street&quot; that local groups book for their own events,
        screenings among them.
      </p>
    </section>
  );
}

export const seoDescription =
  "Tottenham's Latin American market opposite Seven Sisters station";
export const seoHighlights = "community screenings in the market's own room";

export default VenueBlurb;
