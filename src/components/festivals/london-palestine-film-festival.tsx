import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The London Palestine Film Festival (LPFF) was established in the late
        1990s and ran until a hiatus in 2014, returning in 2018. Now a Community
        Interest Company, it describes itself as &ldquo;a stimulating platform
        that brings together filmmakers, scholars and the public in order to
        encourage crucial dialogue regarding Palestine&rsquo;s film industry,
        its culture and its politics&rdquo;.
      </p>
      <p>
        Each November the festival spends around a fortnight across cinemas
        throughout London — regularly including{" "}
        <Link href="/venues/the-barbican">the Barbican</Link>,{" "}
        <Link href="/venues/curzon-soho">Curzon Soho</Link>,{" "}
        <Link href="/venues/institute-of-contemporary-arts">the ICA</Link> and{" "}
        <Link href="/venues/the-garden-cinema">The Garden Cinema</Link>. Its
        programme mixes new releases and UK premieres with archival footage and
        retrospective screenings, many followed by screen talks, Q&amp;As or
        workshops. The festival also commissions work of its own: A Grain of
        Sand, a one-woman play about the children of Gaza, opened its 2024
        edition before touring the UK.
      </p>
    </section>
  );
}

export const seoDescription =
  "a platform bringing together filmmakers, scholars and the public for dialogue about Palestine's film industry, its culture and its politics";
export const seoHighlights =
  "UK premieres, archival and retrospective screenings, and screen talks across London each November";

export default FestivalBlurb;
