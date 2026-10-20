import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The London Korean Film Festival (LKFF) is run by the Korean Cultural
        Centre UK, in collaboration with the Korean Film Archive and with
        support from the Korean Film Council. The centre staged its first
        festival in 2006 with a dozen films, and it has grown into an annual
        fortnight of Korean cinema each November, holding its 20th edition in
        2025.
      </p>
      <p>
        The opening and closing galas are held at{" "}
        <Link href="/venues/bfi-southbank">BFI Southbank</Link>, with the rest
        of the programme spread across venues including the{" "}
        <Link href="/venues/institute-of-contemporary-arts">ICA</Link> and{" "}
        <Link href="/venues/cine-lumiere">Ciné Lumière</Link>. Alongside special
        screenings, it is organised into strands such as Cinema Now and
        Women&rsquo;s Voices, &ldquo;a strand dedicated to up-and-coming
        independent women filmmakers&rdquo;.
      </p>
    </section>
  );
}

export const seoDescription =
  "an annual fortnight of Korean cinema each November, run by the Korean Cultural Centre UK at BFI Southbank, the ICA and venues across London";
export const seoHighlights =
  "opening and closing galas, the Cinema Now strand and Women's Voices, a strand for independent women filmmakers";

export default FestivalBlurb;
