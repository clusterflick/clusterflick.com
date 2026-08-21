import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Cyprus High Commission is the diplomatic mission of the Republic of
        Cyprus to the United Kingdom, based at 13 St James&rsquo;s Square in{" "}
        <Link href="/london-cinemas/westminster/">Westminster</Link>. Alongside
        its consular work, it runs a cultural programme through its Cultural
        Section, with concerts, exhibitions and talks presenting Cypriot art and
        heritage in London.
      </p>
      <p>
        That programme extends to the screen, with screenings of Cypriot films
        and documentaries hosted at the High Commission.
      </p>
    </section>
  );
}

export const seoDescription =
  "Cypriot diplomatic mission and cultural venue in St James's Square";
export const seoHighlights =
  "Cypriot film screenings, exhibitions and cultural events";

export default VenueBlurb;
