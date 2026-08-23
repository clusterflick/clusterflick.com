import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        HKUK Kingston Community Centre was created by Hong Kong people who had
        recently moved to{" "}
        <Link href="/london-cinemas/kingston-upon-thames/">
          Kingston upon Thames
        </Link>
        , and runs as a community platform for the Hong Kong population in
        Kingston and the surrounding areas. It occupies the old telephone
        exchange on Ashdown Road and puts on classes, courses, community events
        and its Kingston Night Vibes evenings.
      </p>
      <p>
        Film is part of that cultural programming, with Cantonese-language
        screenings and Q&amp;As alongside the rest of what the centre does.
      </p>
    </section>
  );
}

export const seoDescription =
  "Hong Kong community centre in Kingston upon Thames";
export const seoHighlights = "Cantonese-language screenings and Q&As";

export default VenueBlurb;
