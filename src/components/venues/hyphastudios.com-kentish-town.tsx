import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Hypha Studio is a former cinema in{" "}
        <Link href="/london-cinemas/camden/">Camden</Link> that has been
        transformed into artist studios and a creative community hub on Prince
        of Wales Road in Kentish Town. The space is supported by Camden Council
        as part of their Neighbourhood Spaces initiative, which aims to create
        community-governed hubs combining local organisations, businesses, and
        residents.
      </p>
      <p>
        The venue is home to resident artist collectives including the Palace
        Cinema Art Collective, who host regular public events such as film
        screenings, discussions, readings, and activity sessions.
      </p>
    </section>
  );
}

export const seoDescription =
  "artist studios and community cinema hub in Kentish Town";
export const seoHighlights =
  "community film screenings, artist collectives and cultural events";

export default VenueBlurb;
