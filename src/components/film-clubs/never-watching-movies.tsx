import Link from "next/link";

function FilmClubBlurb() {
  return (
    <section>
      <p>
        Never Watching Movies is curated by Zain Gibson, social media manager at
        the <Link href="/venues/rio-cinema">Rio Cinema</Link> in{" "}
        <Link href="/london-cinemas/hackney">Hackney</Link>, and screens
        diaspora film — one of a handful of clubs the Rio&apos;s own staff run
        out of the building. Screenings come with an introduction from Gibson,
        and often a guest: <em>Car Wash</em> was co-presented with Claire
        Harrison of{" "}
        <Link href="/film-clubs/category-h-film-club">Category H</Link>, and a
        Rio Forever night paired <em>Empire Records</em> with a Q&amp;A between
        current and former Rio staff on what it is actually like to work in the
        UK&apos;s longest running cinema.
      </p>
      <p>
        It plays out beyond the Rio too. A night at{" "}
        <Link href="/venues/dalston-superstore">Dalston Superstore</Link> with{" "}
        <Link href="/film-clubs/transmissions">Transmissions</Link> — where the
        club was billed as &ldquo;a cultural force hailing from our neighbours
        at the Rio cinema&rdquo; — screened Dee Rees&apos;s <em>Pariah</em>,
        reading its rare portrait of Black stud culture as an exploration of
        masculinity and self-discovery, with relaxed first-come seating and
        subtitles throughout.
      </p>
    </section>
  );
}

export const seoDescription =
  "Zain Gibson's Dalston film club, screening diaspora cinema at the Rio and beyond with introductions and guest co-hosts";

export default FilmClubBlurb;
