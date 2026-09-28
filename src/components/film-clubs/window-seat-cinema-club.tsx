import Link from "next/link";

function FilmClubBlurb() {
  return (
    <section>
      <p>
        Window Seat is a film club screening hand-picked world cinema across
        London, with every screening taking you to a different part of the
        world. Its founder, Krishna, started it after living in Paris, where
        subtitled screenings of French cinema were an everyday thing, to bring
        the same experience back to London.
      </p>
      <p>
        The programme mixes celebrated international films with lesser-known
        titles that rarely reach UK screens, always in the original language
        with English subtitles and never dubbed. It partners with independent
        cinemas and small venues, including the{" "}
        <Link href="/venues/london-film-school">London Film School</Link> and
        the{" "}
        <Link href="/venues/close-up-film-centre">Close-Up Film Centre</Link>.
      </p>
    </section>
  );
}

export const seoDescription =
  "hand-picked world cinema in its original language with English subtitles, at independent venues across London";

export default FilmClubBlurb;
