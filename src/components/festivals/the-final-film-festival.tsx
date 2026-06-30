import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The Final Film Festival is a London festival showcasing new independent
        and restoration premieres to a local audience. Founded by directors Jack
        Hewitt and Kit Ramsay, it pairs its own curation with guest programmers
        drawn from film collectives and individual cinephiles — including the
        likes of Canal Film Club, Cinema Year Zero and Electric Blue Cinema —
        for a community-driven weekend of cinema.
      </p>
      <p>
        The 2026 edition runs from 6–9 August, opening at{" "}
        <Link href="/venues/curzon-soho">Curzon Soho</Link>, with further venues
        announced in the run-up to the festival.
      </p>
    </section>
  );
}

export const seoDescription =
  "A London weekend of new independent and restoration premieres, blending in-house curation with guest programmers from across the city's film collectives";
export const seoHighlights =
  "independent and restoration premieres curated with guest programmers, opening at Curzon Soho";

export default FestivalBlurb;
