import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        French Film Festival UK describes itself as &ldquo;the UK&rsquo;s only
        festival dedicated to French and francophone cinema&rdquo;. It began in
        Edinburgh and Glasgow in 1992, co-founded by Richard Mowe, who still
        directs it, and has since spread to more than 40 venues across the
        country.
      </p>
      <p>
        Its 34th edition runs from 4 November to 9 December 2026, with
        premieres, new talent, restored classics, screenings for schools and
        what it calls &ldquo;memorable encounters&rdquo;. In London this year it
        screens at venues including{" "}
        <Link href="/venues/the-gate-picturehouse">The Gate Picturehouse</Link>.
        It is a separate festival from the French Film Festival London at Ciné
        Lumière.
      </p>
    </section>
  );
}

export const seoDescription =
  "a touring festival of French and francophone cinema, founded in Edinburgh and Glasgow in 1992 and now screening at more than 40 venues across the UK";
export const seoHighlights = "premieres, new talent and restored classics";

export default FestivalBlurb;
