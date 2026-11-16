import Link from "next/link";

function FilmClubBlurb() {
  return (
    <section>
      <p>
        GoodFilmHunting is a London film club started by three friends, Tom
        Couffon, Hugo Brown and Monty Pritchard, &quot;on a mission to build a
        community around cinema&quot;. Rather than three-hour challenges, it
        picks what it calls &quot;90-minute bangers (give or take)&quot;: films
        you might not have caught before, chosen to &quot;spark great
        conversations and might just inspire you to venture deeper into
        cinema&quot;. Its nights are numbered rather than named, often pair the
        film with food, and have moved between venues around{" "}
        <Link href="/london-cinemas/hackney/">Hackney</Link>.
      </p>
    </section>
  );
}

export const seoDescription =
  "a London film club screening 90-minute films you might have missed, often with food";

export default FilmClubBlurb;
