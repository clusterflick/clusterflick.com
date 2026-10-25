import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The Romanian Film Festival in London has brought new Romanian cinema to
        UK audiences since 2003. A non-profit festival run in partnership with
        Curzon, it pairs recent features and documentaries, many of them UK
        premieres, with restorations from the country&rsquo;s back catalogue,
        and brings directors and cast over from Romania for Q&amp;As.
      </p>
      <p>
        The festival has long been at home at{" "}
        <Link href="/venues/curzon-soho">Curzon Soho</Link>. The 2026 edition
        runs in early December at{" "}
        <Link href="/venues/curzon-mayfair">Curzon Mayfair</Link> and Curzon
        Soho, with a Q&amp;A after every screening.
      </p>
    </section>
  );
}

export const seoDescription =
  "London's annual festival of new Romanian cinema, held at Curzon since 2003";
export const seoHighlights =
  "new Romanian features and documentaries, UK premieres and restorations, with filmmaker Q&As";

export default FestivalBlurb;
