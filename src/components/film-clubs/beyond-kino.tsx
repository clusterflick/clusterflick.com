import Link from "next/link";

function FilmClubBlurb() {
  return (
    <section>
      <p>
        Beyond Kino is a London community film club dedicated to Hungarian cult
        cinema. Since February 2025 it has run free monthly screenings at the{" "}
        <Link href="/venues/liszt-institute">Liszt Institute</Link>, the
        Hungarian Cultural Centre in{" "}
        <Link href="/london-cinemas/westminster">Westminster</Link>, for film
        lovers, Hungarian expats and culturally curious Londoners. Films are
        shown in Hungarian with English subtitles, and each is followed by a
        moderated discussion and time to meet: &quot;Come for the film. Stay for
        the conversation.&quot;
      </p>
      <p>
        Past screenings include István Szabó&apos;s <em>Colonel Redl</em> and
        Zoltán Huszárik&apos;s <em>Sinbad</em>, and the club has also taken a
        night to <Link href="/venues/genesis-cinema">Genesis Cinema</Link>, for{" "}
        <em>Stars of Little Importance</em> with a Q&amp;A with its director,
        Renátó Olasz.
      </p>
    </section>
  );
}

export const seoDescription =
  "a London community film club with free monthly screenings of Hungarian cult cinema at the Liszt Institute, each followed by a discussion";

export default FilmClubBlurb;
