import Link from "next/link";

function FilmClubBlurb() {
  return (
    <section>
      <p>
        Kinoema Accessible Screenings, founded by Effie Veremi, puts on
        inclusive film events across London built around creative formats,
        community discussion and a commitment to representation. Its programme
        centres disabled filmmakers and stories, from documentaries about
        disability to an anthology of horror shorts made by disabled women.
      </p>
      <p>
        Screenings are relaxed: the sound is a little lower, some lights stay
        on, there is a quiet space to step out to, and films carry descriptive
        subtitles. Most are followed by a Q&amp;A with the filmmakers. Kinoema
        has screened at{" "}
        <Link href="/venues/the-garden-cinema">The Garden Cinema</Link> and the{" "}
        <Link href="/venues/kiln-theatre">Kiln Theatre</Link>, and has partnered
        with <Link href="/film-clubs/sick-girl-films">Sick Girl Films</Link>.
      </p>
    </section>
  );
}

export const seoDescription =
  "relaxed, accessible screenings centring disabled filmmakers and stories, with discussions and Q&As at venues across London";

export default FilmClubBlurb;
