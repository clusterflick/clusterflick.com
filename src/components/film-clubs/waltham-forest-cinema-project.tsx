import Link from "next/link";

function FilmClubBlurb() {
  return (
    <section>
      <p>
        Waltham Forest Cinema Project is a community campaign with a simple
        starting point:{" "}
        <Link href="/london-cinemas/waltham-forest">Waltham Forest</Link> has no
        independent cinema, and they want to change that. The long-term goal is
        a two or three screen venue with a café-bar and a community events
        space, within a fifteen minute walk of home — open, affordable, and a
        place to gather rather than just sit in the dark.
      </p>
      <p>
        Until that space exists, they put on screenings across the borough,
        mostly at{" "}
        <Link href="/venues/good-shepherd-studios">Good Shepherd Studios</Link>{" "}
        in Leytonstone, with occasional events elsewhere including{" "}
        <Link href="/venues/walthamstow-trades-hall">
          Walthamstow Trades Hall
        </Link>
        . The programme leans towards documentary, local filmmakers, and
        screenings built out into something more — silent films with live
        scores, post-film discussions, Q&amp;As with directors, puppet-making
        workshops for the kids, and the odd free community screening.
      </p>
    </section>
  );
}

export const seoDescription =
  "a community campaign to bring an independent cinema to Waltham Forest, running pop-up screenings across the borough in the meantime";

export default FilmClubBlurb;
