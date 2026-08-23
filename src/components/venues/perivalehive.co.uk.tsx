import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Perivale Community Hive is a community-managed library and community hub
        on Horsenden Lane South in{" "}
        <Link href="/london-cinemas/ealing/">Ealing</Link>, run by trustees and
        volunteers who took on Perivale Library and kept it open. Its founders
        describe the library as somewhere that gives people a sense of belonging
        in a city where it is easy to feel isolated — a place to talk to
        someone, read a book, or simply have a cup of tea.
      </p>
      <p>
        The programme runs from dance classes and an artist residency to film,
        with a Perivale Film Club, Silver Screenings for older audiences, and
        festival winners shown in the library.
      </p>
    </section>
  );
}

export const seoDescription =
  "volunteer-run community library and hub in Perivale";
export const seoHighlights = "film club, Silver Screenings and festival shorts";

export default VenueBlurb;
