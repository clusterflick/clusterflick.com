import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Castle Cinema is a beloved independent cinema on Brooksby&apos;s
        Walk in Homerton, <Link href="/london-cinemas/hackney/">Hackney</Link>.
        Opened in 2018 in a beautifully converted former church hall, the
        single-screen cinema programmes a thoughtful mix of new releases,
        independent, arthouse, classic, and repertory films, alongside special
        events, Q&amp;A sessions, and community screenings.
      </p>
      <p>
        With its welcoming atmosphere, affordable prices, excellent bar, and
        strong ties to the local community, The Castle Cinema has quickly
        established itself as one of East London&apos;s favourite independent
        cinemas.
      </p>
    </section>
  );
}

export const seoDescription =
  "independent Hackney cinema in a converted church";
export const seoHighlights =
  "new releases, arthouse, classics and community screenings";

export default VenueBlurb;
