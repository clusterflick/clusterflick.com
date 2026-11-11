import Link from "next/link";

function FilmClubBlurb() {
  return (
    <section>
      <p>
        Fashion Film Club, created by Rosie Okotcha, looks at films through
        their costumes, spotlighting the fashion and creative impact of
        well-loved titles and giving underrated ones, such as{" "}
        <em>Jawbreaker</em> and <em>Jennifer&apos;s Body</em>, the attention
        they missed first time round. Screenings at{" "}
        <Link href="/venues/rhizomatic">Rhizomatic!</Link> in{" "}
        <Link href="/london-cinemas/tower-hamlets">Tower Hamlets</Link> begin
        with an hour to mingle over a drink, and guests are encouraged to dress
        inspired by the film.
      </p>
    </section>
  );
}

export const seoDescription =
  "screenings of underrated fashion films, spotlighting their costumes, from Rosie Okotcha";

export default FilmClubBlurb;
