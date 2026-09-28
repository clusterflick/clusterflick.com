import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Palestine House is &quot;a vibrant cultural and community hub in the
        heart of London&quot;, on High Holborn in{" "}
        <Link href="/london-cinemas/camden/">Camden</Link>. Run as a community
        interest company, it is &quot;dedicated to supporting Palestinian
        rights&quot;, with a mission &quot;to provide a welcoming space for
        Palestinians and allies to come together, celebrate culture, and engage
        in meaningful advocacy&quot;.
      </p>
      <p>
        The building also operates as a private members&apos; club, with
        co-working space, a caf&eacute; and restaurant. Its public programme
        runs from workshops and talks to exhibitions and cultural celebrations,
        and the film screenings among them are listed here.
      </p>
    </section>
  );
}

export const seoDescription =
  "Palestinian cultural and community hub on High Holborn";
export const seoHighlights = "film screenings, talks and cultural events";

export default VenueBlurb;
