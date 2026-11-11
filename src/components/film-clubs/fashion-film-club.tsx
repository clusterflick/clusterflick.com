import Link from "next/link";

function FilmClubBlurb() {
  return (
    <section>
      <p>
        Fashion Film Club, created by Rosie Okotcha, spotlights the costumes and
        creative impact of well-loved and underrated films. Its screenings at{" "}
        <Link href="/venues/rhizomatic">Rhizomatic!</Link> in{" "}
        <Link href="/london-cinemas/tower-hamlets">Tower Hamlets</Link> have so
        far been <em>Jawbreaker</em>, <em>Jennifer&apos;s Body</em> and{" "}
        <em>Secretary</em>. Each evening begins with an hour to mingle and grab
        a drink before the film, guests are encouraged to dress inspired by
        what&apos;s showing, and the popcorn is free.
      </p>
    </section>
  );
}

export const seoDescription =
  "screenings of underrated fashion films, spotlighting their costumes, from Rosie Okotcha";

export default FilmClubBlurb;
