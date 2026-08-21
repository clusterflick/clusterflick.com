import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Orchard Dry Dock is a Grade II listed dock on the Leamouth Peninsula in{" "}
        <Link href="/london-cinemas/tower-hamlets/">Tower Hamlets</Link>, where
        the River Lea meets the Thames. Rediscovered during the building of
        Ballymore&apos;s Goodluck Hope, it has been restored to the outline of a
        great vessel, with elevated seating making it an open, accessible place
        to meet, looking out across the river to the O2.
      </p>
      <p>
        The dock is the hub of the neighbourhood and the place its events
        happen, open-air cinema among them &mdash; screenings have run here as
        part of Ballymore&apos;s Islander Festival, with the river and the
        skyline behind the screen.
      </p>
    </section>
  );
}

export const seoDescription =
  "Restored riverside dry dock and public space at Goodluck Hope";
export const seoHighlights = "open-air cinema and riverside events";

export default VenueBlurb;
