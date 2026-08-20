import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The Ukrainian Film Festival is an annual celebration of contemporary and
        classic Ukrainian cinema run by the Ukrainian Institute London, held at{" "}
        <Link href="/venues/curzon-soho">Curzon Soho</Link>. Its programmes turn
        to Ukraine&apos;s culture and cinema &ldquo;to deepen our understanding
        of the country&apos;s complex history and explore its multifaceted
        identity&rdquo;.
      </p>
      <p>
        Each edition is built around a new concept — past years have run under
        titles including Ukraine Defiant, Side by Side and Reflections — which
        the organisers describe as a way to &ldquo;plug into Ukraine&apos;s
        evolving narrative through its cinema, offering a dynamic platform for
        both established and emerging filmmakers&rdquo;. Features and shorts
        screen together, most with a Q&amp;A after.
      </p>
    </section>
  );
}

export const seoDescription =
  "the Ukrainian Institute London's annual celebration of contemporary and classic Ukrainian cinema at Curzon Soho";
export const seoHighlights =
  "features and shorts by established and emerging Ukrainian filmmakers, most with a Q&A";

export default FestivalBlurb;
