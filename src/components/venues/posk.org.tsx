import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        POSK &mdash; the Polish Social and Cultural Association, or Polski
        Ośrodek Społeczno-Kulturalny &mdash; calls itself the largest Polish
        centre in Europe. Founded in 1967, it has occupied its part-brutalist
        building on King Street in{" "}
        <Link href="/london-cinemas/hammersmith-and-fulham/">Hammersmith</Link>{" "}
        since the 1970s, and holds a theatre presenting &quot;plays and concerts
        by outstanding artists&quot;, a gallery, a Jazz Café running workshops
        and jam sessions, the Łowiczanka restaurant, and a Polish library
        founded in 1942 that is among the largest outside Poland.
      </p>
      <p>
        Film runs through the building as POSK Kino, which programmes Polish
        cinema and retrospectives &mdash; among them a season devoted to Andrzej
        Wajda.
      </p>
    </section>
  );
}

export const seoDescription =
  "The largest Polish cultural centre in Europe, in Hammersmith";
export const seoHighlights =
  "Polish cinema and retrospectives, theatre, jazz and exhibitions";

export default VenueBlurb;
