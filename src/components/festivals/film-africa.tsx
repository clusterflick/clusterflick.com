import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        Film Africa describes itself as &ldquo;the UK&rsquo;s largest annual
        festival of African cinema&rdquo;. Presented by the Royal African
        Society, it was first held in 2011 as ten days of contemporary African
        film across London. Its programme mixes features, documentaries and
        shorts with talks and symposiums.
      </p>
      <p>
        The festival is based at{" "}
        <Link href="/venues/bfi-southbank">BFI Southbank</Link>, which hosts its
        opening and closing nights, and spreads out to partner venues including{" "}
        <Link href="/venues/cine-lumiere">Ciné Lumière</Link>,{" "}
        <Link href="/venues/riverside-studios">Riverside Studios</Link> and the{" "}
        <Link href="/venues/rio-cinema">Rio Cinema</Link>. The 2026 edition runs
        from 23 October to 1 November, marking the Royal African Society&rsquo;s
        125th anniversary, and includes Twende, a symposium on African women and
        cinema.
      </p>
    </section>
  );
}

export const seoDescription =
  "the UK's largest annual festival of African cinema, presented by the Royal African Society at BFI Southbank and partner venues across London";
export const seoHighlights =
  "African features, documentaries and short film programmes, with talks and symposiums";

export default FestivalBlurb;
