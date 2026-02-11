import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Curzon Camden is part of the Curzon cinema group, a celebrated chain of
        independent cinemas known for championing arthouse, independent, and
        world cinema alongside quality mainstream releases. Located on Dockray
        Place near Camden Town, this venue features multiple screening rooms
        with comfortable seating, as well as a bar area. Like all Curzon venues,
        it offers the Curzon membership scheme and access to Curzon Home Cinema,
        the chain&apos;s on-demand streaming platform.
      </p>
      <p>
        Fitting in with <Link href="/london-cinemas/camden/">Camden</Link>
        &apos;s reputation as one of London&apos;s most vibrant cultural
        neighbourhoods, the cinema programmes a mix of independent,
        foreign-language, and documentary films alongside broader releases,
        special screenings, and Q&amp;A events.
      </p>
    </section>
  );
}

export const seoDescription = "arthouse cinema in vibrant Camden Town";
export const seoHighlights =
  "independent, foreign-language films and special screenings";

export default VenueBlurb;
