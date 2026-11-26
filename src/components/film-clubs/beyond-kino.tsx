import Link from "next/link";

function FilmClubBlurb() {
  return (
    <section>
      <p>
        Beyond Kino is a London film club dedicated to discovering Hungarian
        cinema through shared experiences and meaningful conversations. Its
        screenings bring together film lovers from all backgrounds, in a
        welcoming space to explore stories that go beyond borders.
      </p>
      <p>
        Its nights are held at the{" "}
        <Link href="/venues/liszt-institute">Liszt Institute</Link>, the
        Hungarian Cultural Centre in{" "}
        <Link href="/london-cinemas/westminster">Westminster</Link>, and range
        from animated classics to recent Hungarian films.
      </p>
    </section>
  );
}

export const seoDescription =
  "a London film club discovering Hungarian cinema through screenings and conversation at the Liszt Institute";

export default FilmClubBlurb;
