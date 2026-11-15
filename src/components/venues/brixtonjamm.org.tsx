import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Brixton Jamm calls itself &quot;South London&apos;s iconic party
        venue&quot;, a club and gig space on Brixton Road in{" "}
        <Link href="/london-cinemas/lambeth/">Lambeth</Link> that has been part
        of the area&apos;s music scene for two decades. Alongside the club, with
        its in-house Martin Audio sound system, are a bar and a refurbished
        outdoor courtyard of heated, covered booths.
      </p>
      <p>
        The Beach, a room with a retractable roof and sand on the floor, has
        &quot;a massive 3m LED screen showing sports, film &amp; TV
        screenings&quot;. Screenings can also come as part of a promoter&apos;s
        night held in one of its other rooms.
      </p>
    </section>
  );
}

export const seoDescription =
  "Brixton club and gig venue with a courtyard and screen room";
export const seoHighlights = "film screenings, club nights, live music";

export default VenueBlurb;
