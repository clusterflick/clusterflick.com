import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Building Centre is a hub for the built environment on Store Street
        in <Link href="/london-cinemas/camden/">Camden</Link>, founded in 1931
        as a building materials bureau at the Architectural Association and open
        to the public since 1932. Its Main Gallery, Lower Gallery and Glass Room
        host a free exhibition and events programme bringing together
        architecture, construction and design.
      </p>
      <p>
        Building Centre Film Club is a screening and conversation series on
        film, architecture and urban life, showing films that open up questions
        about the places we live in, move through, build and imagine — Jacques
        Tati&apos;s Playtime among them — with the galleries open to look round
        before the screening.
      </p>
    </section>
  );
}

export const seoDescription =
  "built environment gallery and film club on Store Street";
export const seoHighlights =
  "films on architecture and urban life, free exhibitions";

export default VenueBlurb;
