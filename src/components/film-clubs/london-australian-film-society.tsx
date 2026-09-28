import Link from "next/link";

function FilmClubBlurb() {
  return (
    <section>
      <p>
        The London Australian Film Society screened its first film on 20 July
        1973, in the Cinema Hall of Australia House on the Strand, and held
        regular screenings there for more than three decades, often with
        visiting filmmakers. Since 2009 it has been self-funded and run by
        volunteers, a group of Australians and Brits in London who work in film
        and television, education, curation and publishing.
      </p>
      <p>
        It shows new and classic Australian features, documentaries and shorts,
        many of which never otherwise reach UK cinemas, lately at{" "}
        <Link href="/venues/finsbury-park-picturehouse">
          Finsbury Park Picturehouse
        </Link>
        , often with a Q&amp;A. In 2017 it founded the{" "}
        <Link href="/festivals/london-australian-film-festival">
          London Australian Film Festival
        </Link>
        .
      </p>
    </section>
  );
}

export const seoDescription =
  "Australian features, documentaries and shorts in London, a volunteer-run film society since 1973";

export default FilmClubBlurb;
