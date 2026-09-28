import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Osterley Park and House is a National Trust estate in Isleworth,{" "}
        <Link href="/london-cinemas/hounslow/">Hounslow</Link>, which it
        describes as &quot;a Georgian country estate in west London&quot;. The
        house&apos;s grand rooms were designed by Robert Adam for the Child
        family between 1761 and 1780.
      </p>
      <p>
        Around it are a Tudor walled garden, 18th-century flower beds, lakes and
        acres of parkland open all year, used for everything from bike rides to
        seasonal trails. Film comes to the estate as outdoor cinema, with
        seasonal screenings set up in the grounds.
      </p>
    </section>
  );
}

export const seoDescription = "Georgian country estate in west London";
export const seoHighlights = "seasonal outdoor cinema in historic parkland";

export default VenueBlurb;
