import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The London Action Resource Centre is a collectively owned and run
        building on Fieldgate Street in Whitechapel, in{" "}
        <Link href="/london-cinemas/tower-hamlets/">Tower Hamlets</Link>. It
        provides space for &quot;self-organised, non-hierarchical projects for
        radical social change&quot;, with a library and radical archive, a
        rooftop garden and a banner-making workshop in the basement.
      </p>
      <p>
        Film comes from the groups who book its main hall for meetings,
        screenings and events. No one is employed, decisions are made at monthly
        open meetings, and it runs on donations from the people who use it.
      </p>
    </section>
  );
}

export const seoDescription =
  "a collectively run Whitechapel building for radical social change";
export const seoHighlights =
  "screenings and fundraisers by grassroots groups in its main hall";

export default VenueBlurb;
