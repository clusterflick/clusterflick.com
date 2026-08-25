import Link from "next/link";

function FilmClubBlurb() {
  return (
    <section>
      <p>
        Never Watching Movies screens diaspora film, curated by Zain Gibson,
        social media manager at the{" "}
        <Link href="/venues/rio-cinema">Rio Cinema</Link> in{" "}
        <Link href="/london-cinemas/hackney">Hackney</Link> and one of several
        clubs the Rio&apos;s own staff run out of the building. Nights are
        introduced from the front of the room, often with a guest co-host from
        another London club, and the club takes its programme beyond the Rio to
        venues around Dalston.
      </p>
      <p>
        What Gibson is after is the room rather than the film alone: &ldquo;I
        think watching any film with other people makes it a completely
        different experience. The most rewarding part is whether it&apos;s a
        busy event or a small event, it&apos;s something that impacts
        someone.&rdquo;
      </p>
    </section>
  );
}

export const seoDescription =
  "Zain Gibson's Dalston film club, screening diaspora cinema at the Rio Cinema and beyond";

export default FilmClubBlurb;
