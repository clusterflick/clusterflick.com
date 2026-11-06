import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Wapping Powerhouse is a former hydraulic power station on Wapping Wall
        in <Link href="/london-cinemas/tower-hamlets/">Tower Hamlets</Link>,
        opened in 1890 as one of five that served London, and the last of its
        kind to be decommissioned. The Glass Castle Foundation is its custodian,
        restoring the building as &quot;an ambitious experimental arts
        venue&quot;.
      </p>
      <p>
        Its events are made with cultural partners, from experimental
        performance to work with technology. Screenings are set up with local
        community groups.
      </p>
    </section>
  );
}

export const seoDescription =
  "former hydraulic power station in Wapping, now an experimental arts venue";
export const seoHighlights =
  "screenings with community partners and experimental arts";

export default VenueBlurb;
