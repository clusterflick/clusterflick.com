import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The London Latino Film Festival (LoLaFF) holds its first edition from
        2–6 October 2026, with sixty feature-length and short films from across
        Latin America and its diasporas — from the likes of Puerto Rico, Brazil
        and the Dominican Republic — spanning feature fiction, documentary,
        animation and short film. Its founders describe a festival that
        &ldquo;doesn&apos;t believe in passive viewing&rdquo;, set on
        &ldquo;amplifying voices too often overlooked&rdquo; and making Latin
        American stories impossible to ignore.
      </p>
      <p>
        Screenings run across London venues including{" "}
        <Link href="/venues/the-barbican">the Barbican</Link>,{" "}
        <Link href="/venues/institute-of-contemporary-arts">the ICA</Link>,{" "}
        <Link href="/venues/cine-lumiere">Ciné Lumière</Link>,{" "}
        <Link href="/venues/bfi-stephen-street">BFI Stephen Street</Link> and{" "}
        <Link href="/venues/the-garden-cinema">The Garden Cinema</Link>, with
        Q&amp;As alongside the films and a wider community programme of cultural
        and educational events leading up to the festival.
      </p>
    </section>
  );
}

export const seoDescription =
  "the first edition of London's festival of Latin American cinema, with sixty features and shorts from across Latin America and its diasporas";
export const seoHighlights =
  "feature fiction, documentary, animation and short film with Q&As across the Barbican, the ICA, Ciné Lumière, BFI Stephen Street and The Garden Cinema";

export default FestivalBlurb;
