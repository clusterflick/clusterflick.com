import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        New River Studios is housed in a converted furniture warehouse on Eade
        Road in Manor House, in the Harringay Warehouse District of{" "}
        <Link href="/london-cinemas/haringey/">Haringey</Link>. It describes
        itself as &quot;an arts&apos; centre, studio provider, venue, education
        hub, cafe and bar&quot;, and is run on a not-for-profit basis by a
        Community Interest Company of the same name.
      </p>
      <p>
        Behind the café and bar are music practice rooms, recording studios and
        an event space, which carries a programme of gigs, album launches,
        exhibitions, workshops and night markets. Its screenings are put on by
        collectives who hire that space for events of their own, rather than
        programmed by the studios.
      </p>
    </section>
  );
}

export const seoDescription =
  "not-for-profit arts centre in a Manor House furniture warehouse";
export const seoHighlights = "collective-run screenings alongside gigs";

export default VenueBlurb;
