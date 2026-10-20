import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The London Korean Film Festival is run each November by the Korean
        Cultural Centre UK, in collaboration with the Korean Film Archive. Over
        two weeks it brings new Korean features, documentaries and shorts to
        London, from galas and special screenings to Cinema Now and the
        Women&apos;s Voices strand, dedicated to up-and-coming independent women
        filmmakers.
      </p>
      <p>
        Its opening and closing galas are held at{" "}
        <Link href="/venues/bfi-southbank">BFI Southbank</Link>, with the rest
        of the programme spread across venues including the{" "}
        <Link href="/venues/ica">ICA</Link> and{" "}
        <Link href="/venues/cine-lumiere">Ciné Lumière</Link>.
      </p>
    </section>
  );
}

export const seoDescription =
  "New Korean features, documentaries and shorts at BFI Southbank, the ICA and venues across London each November";
export const seoHighlights =
  "Opening and closing galas, Cinema Now and the Women's Voices strand";

export default FestivalBlurb;
