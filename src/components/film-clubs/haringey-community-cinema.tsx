import Link from "next/link";

function FilmClubBlurb() {
  return (
    <section>
      <p>
        Haringey Community Cinema is a grassroots initiative in{" "}
        <Link href="/london-cinemas/haringey">Haringey</Link> screening films
        that &ldquo;challenge, inspire, and spark critical reflections&rdquo;,
        or in its own three words, &ldquo;Watch. Think. Act.&rdquo; The
        programme leans towards political documentaries and features, often put
        on with local campaign groups, and screenings are usually followed by a
        talk or conversation with guest speakers.
      </p>
      <p>
        Screenings are free or pay-what-you-can, a deliberate choice when rising
        costs keep many people from films that reflect their own lives. Most are
        in Tottenham, at{" "}
        <Link href="/venues/the-antwerp-arms">The Antwerp Arms</Link> and{" "}
        <Link href="/venues/lordship-hub-co-op">Lordship Hub</Link>.
      </p>
    </section>
  );
}

export const seoDescription =
  "a grassroots Haringey film club screening political films for free or pay-what-you-can, with talks and discussion";

export default FilmClubBlurb;
