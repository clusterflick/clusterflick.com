import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The Romanian Film Festival UK sets out to &ldquo;celebrate Romanian
        cinema and connect filmmakers with UK wide audiences&rdquo;. Billed as
        &ldquo;London and beyond&rdquo;, it brings recent Romanian features,
        documentaries and restorations to the UK, with filmmakers and cast over
        for Q&amp;As, and is financed by the Department for Romanians Abroad.
      </p>
      <p>
        The 2025 edition was held at{" "}
        <Link href="/venues/curzon-soho">Curzon Soho</Link>, with a pop-up in
        Colchester. The 2026 edition runs in Colchester from 28 to 29 November
        and in London from 2 to 7 December, at{" "}
        <Link href="/venues/curzon-mayfair">Curzon Mayfair</Link> and Curzon
        Soho.
      </p>
    </section>
  );
}

export const seoDescription =
  "a festival of new Romanian cinema in London and beyond, at Curzon Mayfair and Curzon Soho";
export const seoHighlights =
  "recent Romanian features, documentaries and restorations, with filmmaker Q&As";

export default FestivalBlurb;
