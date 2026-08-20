import Link from "next/link";

function FilmClubBlurb() {
  return (
    <section>
      <p>
        Deeper Into Movies is run by Steven T Hanley, who started it with VHS
        screenings in London dive bars and now curates film at{" "}
        <Link href="/venues/moth-club">MOTH Club</Link> in{" "}
        <Link href="/london-cinemas/hackney">Hackney</Link> alongside nights at
        venues across the city. The programming rule is simple and stated
        plainly: &ldquo;I don&apos;t believe in showing anything that&apos;s
        done with a smirk. I don&apos;t do ironic programming. Anything I screen
        I really genuinely love and think other people will.&rdquo;
      </p>
      <p>
        Bills run from important contemporary cinema to overlooked gems, with{" "}
        <Link href="/formats/vhs">VHS</Link> screenings still in the mix, and
        often a lecture, a conversation or a live score alongside the film. What
        Hanley says he wants from it is to &ldquo;keep finding and presenting
        interesting and unusual film programs and hopefully build a regular
        crowd of film lovers where we can watch great movies, discover new ones
        and listen to good music&rdquo;.
      </p>
    </section>
  );
}

export const seoDescription =
  "Steven T Hanley's London film club, pairing important contemporary cinema and overlooked gems with lectures, conversations and live scores";

export default FilmClubBlurb;
