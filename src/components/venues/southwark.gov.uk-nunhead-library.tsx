import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Nunhead Library on Gordon Road is a small community library in{" "}
        <Link href="/london-cinemas/southwark/">Southwark</Link>, in a
        Tudor-style building funded by the philanthropist John Passmore Edwards
        and opened in 1896, its foundation stone carrying the motto &quot;Good
        deeds live on when doers are no more&quot;.
      </p>
      <p>
        Today it has books for reference and loan, study spaces and computers,
        plus rhyme times, a Saturday games club and a book group, and its
        screenings are part of the council&apos;s free events programme,
        Southwark Presents.
      </p>
    </section>
  );
}

export const seoDescription = "Victorian community library in Nunhead";
export const seoHighlights = "free library screenings from Southwark Presents";

export default VenueBlurb;
