import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Bird House is, in its own words, &quot;a neighbourhood brewery, taproom
        and event space under the arches in Herne Hill&quot;, two minutes from
        Herne Hill station in{" "}
        <Link href="/london-cinemas/southwark/">Southwark</Link>. It took over
        the railway arch where Canopy Brewery used to brew, reopening it in
        2024.
      </p>
      <p>
        The brewery focuses on &quot;clean, crisp and refreshing beers&quot;,
        served alongside cocktails and sourdough pizza from its own kitchen. Its
        week runs from quiz Tuesdays and DJ nights to comedy, folk, chess and
        salsa, and film club nights join that rotation, with the taproom given
        over to a screening.
      </p>
    </section>
  );
}

export const seoDescription =
  "Herne Hill brewery and taproom under the railway arches";
export const seoHighlights = "film club nights in a brewery taproom";

export default VenueBlurb;
