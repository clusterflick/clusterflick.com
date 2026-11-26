import Link from "next/link";

function FilmClubBlurb() {
  return (
    <section>
      <p>
        Beyond Kino is a London film club dedicated to discovering Hungarian
        cinema through shared experiences and meaningful conversations, and a
        welcoming space for film lovers from all backgrounds to explore
        &quot;stories that go beyond borders&quot;. Every screening is followed
        by a moderated discussion of the film, its cultural significance and its
        influences: &quot;Come for the film. Stay for the conversation.&quot;
      </p>
      <p>
        Its nights are held at the{" "}
        <Link href="/venues/liszt-institute">Liszt Institute</Link>, the
        Hungarian Cultural Centre in{" "}
        <Link href="/london-cinemas/westminster">Westminster</Link>, and the
        programme runs from István Szabó&apos;s <em>Colonel Redl</em> and{" "}
        <em>Hanussen</em> and Zoltán Huszárik&apos;s <em>Sinbad</em> to the
        animated classic <em>Cat City</em> and recent films such as{" "}
        <em>Larry</em>.
      </p>
    </section>
  );
}

export const seoDescription =
  "a London film club discovering Hungarian cinema, with a moderated discussion after every screening at the Liszt Institute";

export default FilmClubBlurb;
