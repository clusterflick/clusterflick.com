import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        House of Annetta occupies 25 Princelet Street in Spitalfields,{" "}
        <Link href="/london-cinemas/tower-hamlets/">Tower Hamlets</Link>, the
        &quot;former cybernetic home of beekeeper, artist, activist and
        publisher Annetta Pedretti&quot;. It describes itself as &quot;a space
        for learning about the ways in which ownership of land shapes our lives
        and the world around us&quot;.
      </p>
      <p>
        Its work is to &quot;build infrastructure for movements, cultivate
        radical imagination and practice cultures of care&quot;, and the house
        is open to the public for events and gatherings, with film screenings
        among them. It is supported by members, whom it calls
        &quot;housewives&quot;.
      </p>
    </section>
  );
}

export const seoDescription =
  "Spitalfields house exploring land, ownership and radical imagination";
export const seoHighlights = "film screenings and events for movements";

export default VenueBlurb;
