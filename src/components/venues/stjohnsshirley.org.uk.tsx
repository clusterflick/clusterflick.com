import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        St John the Evangelist is the parish church of Shirley, on Shirley
        Church Road in <Link href="/london-cinemas/croydon/">Croydon</Link>. The
        present building, an early Gothic design by Sir Gilbert Scott in flint
        under a spire, was begun in 1854 beside the small chapel of 1836 it
        replaced. Its Victorian stained glass was blown out by a flying bomb in
        1944, and Hugh Easton&apos;s east window of the resurrected Christ
        followed in 1949.
      </p>
      <p>
        The church runs its own cinema nights, &quot;Big screen entertainment @
        St John&apos;s&quot;, pairing a family film in the afternoon with an
        evening screening that has a licensed bar. Every film is shown with
        subtitles, &quot;so we can include as many people as possible&quot;, and
        the money taken goes back into the church.
      </p>
    </section>
  );
}

export const seoDescription =
  "Gilbert Scott parish church in Shirley, Croydon, with its own cinema nights";
export const seoHighlights = "subtitled family and evening screenings";

export default VenueBlurb;
