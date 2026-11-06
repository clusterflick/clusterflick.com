import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Second Home Spitalfields is a workspace on Hanbury Street in{" "}
        <Link href="/london-cinemas/tower-hamlets/">Tower Hamlets</Link>,
        describing itself as &quot;a bold, design-led workspace built for
        startups, entrepreneurs, and creatives&quot;. Planting runs through its
        design, and the building has a rooftop and terrace.
      </p>
      <p>
        Beyond the desks and offices, Second Home runs a cultural programme for
        its members and the local community, with speakers from art, design,
        music and food. Some events come from partner organisations, and Second
        Home organises screenings itself as part of that programme.
      </p>
    </section>
  );
}

export const seoDescription =
  "design-led workspace on Hanbury Street in Spitalfields";
export const seoHighlights = "screenings in its cultural programme";

export default VenueBlurb;
