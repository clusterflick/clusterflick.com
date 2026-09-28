import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Established in 2001, the Armenian Institute is a cultural centre on
        Onslow Street in <Link href="/london-cinemas/camden/">Camden</Link> that
        fosters &quot;dialogue and connection between the UK and Armenia, the
        worldwide Armenian diaspora, and the cultures of its wider historical
        neighbours&quot;. It is an independent charity, housed in a space
        provided by the Tanielian family.
      </p>
      <p>
        At its core is what it calls &quot;Europe&apos;s most accessible library
        and archival collection&quot; on the history, arts and literature of
        Armenia, which grew from the personal library of Oxford&apos;s first
        Calouste Gulbenkian Professor of Armenian Studies. Alongside language
        classes, talks, workshops and music, it hosts screenings that bring
        Armenian film and artists to a London audience.
      </p>
    </section>
  );
}

export const seoDescription =
  "Armenian cultural centre, library and archive in central London";
export const seoHighlights = "screenings of Armenian film and culture";

export default VenueBlurb;
