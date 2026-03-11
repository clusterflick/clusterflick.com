import Link from "next/link";

function FilmClubBlurb() {
  return (
    <section>
      <p>
        Jellied Reels is a monthly film club at{" "}
        <Link href="/venues/the-castle-cinema">The Castle Cinema</Link> in{" "}
        <Link href="/london-cinemas/hackney">Hackney</Link>, programming the
        best films you&apos;ve never tried — and won&apos;t find on streaming.
        The name nods to jellied eels, that most quintessentially east London of
        delicacies, and the club has a similarly local, irreverent character.
      </p>
      <p>
        Each programme is carefully curated: Soviet sci-fi, Greek weird wave,
        cult literary adaptations, overlooked Hollywood, and the odd 90s camp
        classic sit side by side. Real curatorial care goes into each pick —
        sourcing newly translated subtitles, championing prints that deserve a
        proper audience. If it&apos;s underseen, under-loved, or unfairly
        streaming-purgatory, Jellied Reels will probably get there first.
      </p>
    </section>
  );
}

export const seoDescription =
  "monthly screenings of underseen and unstreamed cinema at The Castle Cinema, Hackney — with a quintessentially east London sensibility";

export default FilmClubBlurb;
