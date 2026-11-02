import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Pretty Decent&apos;s newest bar sits at Bow Wharf, on the edge of
        Victoria Park in{" "}
        <Link href="/london-cinemas/tower-hamlets/">Tower Hamlets</Link>. There
        is a cosy, warmly lit bar up front and a lively beer hall out back, with
        communal benches, foosball and retro arcade games, and its 12 taps are
        traditional Czech Lukr taps.
      </p>
      <p>
        A TV here shows the likes of Eurovision and the Euros, and there&apos;s
        a monthly karaoke party. Pretty Decent&apos;s free Sunday Movie Club
        comes here as well, with Victoria Park getting its own line-up of films.
      </p>
    </section>
  );
}

export const seoDescription =
  "Pretty Decent's Bow Wharf beer hall by Victoria Park";
export const seoHighlights = "free Sunday Movie Club";

export default VenueBlurb;
