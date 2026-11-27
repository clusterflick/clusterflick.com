import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        Super Shorts Film Festival &ldquo;highlights independent short film
        talent from around the globe&rdquo;, with annual editions in London, New
        York and Los Angeles. Founded in London in 2003 and revived in 2018
        after a four-year break, it is now run with Cinematory, and has screened
        at <Link href="/venues/bfi-stephen-street">BFI Stephen Street</Link> in
        Fitzrovia since 2019.
      </p>
      <p>
        It shows first-time and seasoned filmmakers alike, with the aim, in the
        organisers&rsquo; words, of creating &ldquo;a warm, open atmosphere in
        which filmmakers, fans, critics, and producers can watch the films of
        emerging talents&rdquo;. The London edition is a run of evening
        sessions, each a programme of nine to eleven shorts: three in 2026, from
        8 to 10 December.
      </p>
    </section>
  );
}

export const seoDescription =
  "a festival of independent short films from around the world, screening in London at BFI Stephen Street since 2019";
export const seoHighlights =
  "evening programmes of new shorts by first-time and seasoned filmmakers from around the world";

export default FestivalBlurb;
