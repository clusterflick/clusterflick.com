import Link from "next/link";

function FilmClubBlurb() {
  return (
    <section>
      <p>
        Haringey Community Cinema puts on free screenings in{" "}
        <Link href="/london-cinemas/haringey">Haringey</Link> under the motto
        &ldquo;Watch. Think. Act.&rdquo; Since launching in 2025 it has run
        themed seasons on migration, emancipation and liberation, pairing
        political documentaries and features with guest speakers and a community
        conversation after the film.
      </p>
      <p>
        Screenings are usually on weekend afternoons in Tottenham, at{" "}
        <Link href="/venues/the-antwerp-arms">The Antwerp Arms</Link>, the
        community-owned pub on Church Road, and at{" "}
        <Link href="/venues/lordship-hub-co-op">Lordship Hub</Link> on Lordship
        Rec. They are free and open to all, booked through Eventbrite, and often
        made with local campaign groups.
      </p>
    </section>
  );
}

export const seoDescription =
  "free community screenings in Tottenham pairing political films with guest speakers and discussion";

export default FilmClubBlurb;
