import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The Unrestricted View Horror Film Festival is &ldquo;an independent Film
        Festival run by filmmakers&rdquo;, the Halloween sibling of the
        Unrestricted View Film Festival. Both were set up in 2016 by James Wren,
        who with Felicity Wren runs Unrestricted View, the resident theatre
        company at the{" "}
        <Link href="/venues/the-hen-and-chickens-theatre-bar">
          Hen &amp; Chickens Theatre
        </Link>{" "}
        in <Link href="/london-cinemas/islington">Islington</Link> since 1999
        &mdash; the festival&rsquo;s &ldquo;spiritual home&rdquo; and its hub.
      </p>
      <p>
        The 11th edition runs from 26 October to 1 November 2026. It opens with
        a night of UK horror shorts at{" "}
        <Link href="/venues/everyman-screen-on-the-green">
          Everyman Screen on the Green
        </Link>
        , then moves to{" "}
        <Link href="/venues/odeon-luxe-and-dine-islington">
          ODEON Luxe &amp; Dine Islington
        </Link>{" "}
        and <Link href="/venues/art-house-crouch-end">ArtHouse Crouch End</Link>{" "}
        for further shorts programmes, before settling at the Hen &amp; Chickens
        for independent horror features from the UK and abroad, industry talks
        and Halloween screenings of horror classics.
      </p>
    </section>
  );
}

export const seoDescription =
  "an independent horror film festival run by filmmakers, based at Islington's Hen & Chickens Theatre every Halloween week since 2016";
export const seoHighlights =
  "independent horror features and short film programmes from the UK and abroad, industry talks and Halloween screenings of horror classics, across Islington and Crouch End";

export default FestivalBlurb;
