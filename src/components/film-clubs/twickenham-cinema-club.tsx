import Link from "next/link";

function FilmClubBlurb() {
  return (
    <section>
      <p>
        Twickenham Cinema Club is a not-for-profit community cinema club in{" "}
        <Link href="/london-cinemas/richmond-upon-thames/">
          Richmond upon Thames
        </Link>
        , run by its member volunteers for its members. It sets out &quot;to
        show outstanding, award-winning, art house and recent &apos;films you
        missed&apos; on the big screen&quot;, and aims to be a friendly,
        sociable cinema club for film fans of all ages.
      </p>
      <p>
        Its screenings are monthly, and have moved between venues around
        Twickenham.
      </p>
    </section>
  );
}

export const seoDescription =
  "a volunteer-run community cinema club in Twickenham showing art house, award-winning and missed films";

export default FilmClubBlurb;
