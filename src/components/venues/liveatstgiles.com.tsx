import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Live At St Giles is the performance programme of St Giles&apos; Church
        in Camberwell, <Link href="/london-cinemas/southwark/">Southwark</Link>{" "}
        - a working church in a Grade II* listed building that calls itself
        &quot;south London&apos;s most stunning Neo-Gothic music venue&quot;. It
        holds up to 400, and bookings are &quot;carefully curated&quot; to
        respect the space.
      </p>
      <p>
        The programme runs from classical and contemporary music to opera and
        the &quot;now-infamous&quot; ORGANOKE, with Jazzlive at the Crypt
        beneath the church since 1995. Film comes as live silent-film screenings
        and films shown with live performance, and every booking helps fund the
        church&apos;s preservation.
      </p>
    </section>
  );
}

export const seoDescription = "Neo-Gothic church venue in Camberwell";
export const seoHighlights =
  "live silent films and screenings with live performance";

export default VenueBlurb;
