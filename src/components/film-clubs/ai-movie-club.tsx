import Link from "next/link";

function FilmClubBlurb() {
  return (
    <section>
      <p>
        AI Movie Club is a free monthly screening and conversation night, run by
        Intelligent Internet in partnership with{" "}
        <Link href="/venues/kensington-central-library">
          Kensington Central Library
        </Link>{" "}
        in{" "}
        <Link href="/london-cinemas/kensington-and-chelsea">
          Kensington and Chelsea
        </Link>
        . It picks films that ask hard questions about artificial intelligence,
        consciousness and what it means to be human.
      </p>
      <p>
        Each night opens with a short talk from a guest working in AI, pitched
        so that no technical background is needed, before the film itself. The
        club is aimed as much at local residents, students and film lovers as at
        people who work in the field.
      </p>
    </section>
  );
}

export const seoDescription =
  "free monthly screenings of films about artificial intelligence, each opened by a talk from a guest working in AI";

export default FilmClubBlurb;
