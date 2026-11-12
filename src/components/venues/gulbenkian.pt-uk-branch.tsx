import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Calouste Gulbenkian Foundation, Lisbon-based and describing itself
        as &quot;an international charitable foundation with cultural,
        educational, social and scientific interests&quot;, has had a UK Branch
        since 1956. Its London home is on Hoxton Square in{" "}
        <Link href="/london-cinemas/hackney/">Hackney</Link>, where it moved
        from Portland Place: the ground and first floors of an existing
        building, opened up by Theis and Khan with a rooflight that lets
        daylight down into an open gallery ringed by glass-partitioned rooms.
      </p>
      <p>
        The branch makes grants across the arts, civil society and climate, with
        a focus on exchange between countries. Film screenings in the building
        are put on by the partner organisations it hosts there.
      </p>
    </section>
  );
}

export const seoDescription =
  "London base of the Calouste Gulbenkian Foundation on Hoxton Square";
export const seoHighlights = "partner film screenings";

export default VenueBlurb;
