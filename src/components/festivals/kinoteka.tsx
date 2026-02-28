import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        Kinoteka is London&apos;s Polish Film Festival, presented annually by
        the Polish Cultural Institute. Running across venues including{" "}
        <Link href="/venues/bfi-southbank">BFI Southbank</Link>,{" "}
        <Link href="/venues/cine-lumiere">Ciné Lumière</Link>,{" "}
        <Link href="/venues/ica">ICA</Link>, and{" "}
        <Link href="/venues/the-barbican">the Barbican</Link>, the festival
        brings the finest Polish cinema — classic and contemporary — to London
        audiences each spring. Since its founding, it has become the UK&apos;s
        leading showcase for Polish film, offering retrospectives, world
        premieres, director Q&amp;As and special events.
      </p>
      <p>
        The 2026 edition is dedicated to the work of Andrzej Wajda, one of
        Polish cinema&apos;s towering figures, with an extensive retrospective
        spanning his war trilogy, the Solidarity trilogy, and later masterworks.
        Alongside the Wajda focus, the programme features a Krzysztof Kieślowski
        strand at Ciné Lumière, a documentary strand at Bertha DocHouse, and a
        wide range of contemporary Polish filmmaking at venues across the city.
      </p>
    </section>
  );
}

export const seoDescription =
  "London's Polish Film Festival, presented by the Polish Cultural Institute across BFI Southbank, Ciné Lumière, ICA and beyond";
export const seoHighlights =
  "Andrzej Wajda retrospective, Kieślowski strand, Polish premieres and director Q&As";

export default FestivalBlurb;
