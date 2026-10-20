import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        Film Africa is the UK&apos;s largest annual festival of African cinema,
        presented by the Royal African Society. Over ten days it brings
        features, documentaries and short film programmes from across the
        continent and its diaspora to London, alongside conversations and
        symposiums with the filmmakers.
      </p>
      <p>
        The festival is based at{" "}
        <Link href="/venues/bfi-southbank">BFI Southbank</Link>, where its
        opening and closing nights are held, and spreads out to partner venues
        across the city — including{" "}
        <Link href="/venues/cine-lumiere">Ciné Lumière</Link>,{" "}
        <Link href="/venues/riverside-studios">Riverside Studios</Link> and the{" "}
        <Link href="/venues/rio-cinema">Rio Cinema</Link>. The 2026 edition
        marks the Royal African Society&apos;s 125th anniversary.
      </p>
    </section>
  );
}

export const seoDescription =
  "The UK's largest annual festival of African cinema, presented by the Royal African Society at BFI Southbank and partner venues across London";
export const seoHighlights =
  "Features, documentaries, short film programmes and filmmaker conversations";

export default FestivalBlurb;
