import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        K.C. Continental Stores is a community-owned cafe and bar at the bottom
        of Caledonian Road in King&apos;s Cross, in{" "}
        <Link href="/london-cinemas/islington/">Islington</Link>. &quot;Run by
        the locals for the locals&quot;, it serves specialty coffee, pastries
        and sandwiches by day, and by night turns into a bar pouring cocktails,
        wine and draught beer.
      </p>
      <p>
        Film comes from organisers who host nights in the bar, so screenings
        share its calendar with other social evenings. It sets out to be a
        &quot;safe, inclusive, and welcoming space for everyone&quot; &mdash;
        dogs included.
      </p>
    </section>
  );
}

export const seoDescription =
  "a community-owned cafe and bar on Caledonian Road in King's Cross";
export const seoHighlights =
  "film nights hosted in the bar alongside other social evenings";

export default VenueBlurb;
