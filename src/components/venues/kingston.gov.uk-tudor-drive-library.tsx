import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Tudor Drive Library is a neighbourhood library on the Tudor Estate,
        north of Kingston town centre in{" "}
        <Link href="/london-cinemas/kingston-upon-thames/">Kingston</Link>,
        which celebrated its 70th anniversary in 2021. A volunteer Friends group
        works to make it &quot;a vibrant community hub&quot;, with talks,
        afternoon activities and a community garden in the grounds.
      </p>
      <p>
        Its extension, opened in 2017 and home to a mahogany model Harrier jet
        recalling the nearby Hawker factory, is a community space for hire, and
        the library&apos;s events, screenings among them, take place there.
      </p>
    </section>
  );
}

export const seoDescription =
  "neighbourhood library on Kingston's Tudor Estate";
export const seoHighlights = "community screenings in the library extension";

export default VenueBlurb;
