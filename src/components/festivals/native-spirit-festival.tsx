import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        Native Spirit calls itself &ldquo;the only Independent annual UK
        festival dedicated to Indigenous Film, Media and Arts&rdquo;. It began
        in 2007, run by the Native Spirit Foundation, which Mapuche leader
        Freddy Trequil founded in 2005, and was established &ldquo;to promote
        Native Filmmakers, talks and performances&rdquo;.
      </p>
      <p>
        The 20th edition brings an international programme of
        Indigenous-produced films to the{" "}
        <Link href="/venues/institute-of-advanced-legal-studies">
          Institute of Advanced Legal Studies
        </Link>{" "}
        in Russell Square on 11 and 14 November 2026.
      </p>
    </section>
  );
}

export const seoDescription =
  "the UK's annual independent festival of Indigenous film, media and arts, running since 2007";
export const seoHighlights =
  "an international programme of Indigenous-produced films";

export default FestivalBlurb;
