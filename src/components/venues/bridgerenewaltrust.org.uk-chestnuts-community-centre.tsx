import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Chestnuts Community Centre sits in Chestnuts Park on St Ann&apos;s Road,
        Tottenham, in <Link href="/london-cinemas/haringey/">Haringey</Link>. It
        is run by the Bridge Renewal Trust, a local charity working to reduce
        health inequalities and build stronger communities across the borough.
      </p>
      <p>
        Its week is a &quot;vibrant mix of activities&quot;, from dance classes
        for kids to chair exercises and arts and crafts, with sessions free or
        affordable so that &quot;all residents are welcome to join&quot;. Film
        comes from local community groups who put on screenings there.
      </p>
    </section>
  );
}

export const seoDescription =
  "a community centre in Chestnuts Park, Tottenham, run by the Bridge Renewal Trust";
export const seoHighlights =
  "community screenings alongside free and affordable activities for all ages";

export default VenueBlurb;
