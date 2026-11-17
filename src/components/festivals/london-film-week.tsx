import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        London Film Week is an independent international film festival, founded
        in 2018 by its artistic director Julien Chapelle and built around a
        simple philosophy: &ldquo;Less choice. More cinema.&rdquo; Each year it
        presents just seven carefully selected features, aiming for &ldquo;a
        focused encounter with exceptional cinema from around the world&rdquo;
        that brings together acclaimed filmmakers and emerging voices.
      </p>
      <p>
        Many of its selections are UK or London premieres, some presented with
        partners such as Cine Brazil. Previous editions have shown work by Wim
        Wenders, Céline Sciamma, Noah Baumbach, Laura Poitras, Takashi Miike and
        Lee Chang-dong. Its early editions were held at{" "}
        <Link href="/venues/regent-street-cinema">Regent Street Cinema</Link> in
        the West End; its 2025 and 2026 editions run for five days in December
        at <Link href="/venues/the-garden-cinema">The Garden Cinema</Link> in
        Covent Garden.
      </p>
    </section>
  );
}

export const seoDescription =
  "an independent international festival of seven carefully selected features";
export const seoHighlights =
  "UK and London premieres from Japan, Brazil, Canada, Austria, the US and the UK, seven features a year";

export default FestivalBlurb;
