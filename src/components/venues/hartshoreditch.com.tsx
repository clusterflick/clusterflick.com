import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Hart Shoreditch is a hotel on Great Eastern Street in Shoreditch,{" "}
        <Link href="/london-cinemas/hackney/">Hackney</Link>, part of
        Hilton&apos;s Curio Collection. Open since 2019, it presents itself as
        &quot;a cultural destination with an exciting line-up of events&quot; as
        much as a place to stay.
      </p>
      <p>
        Its spaces include a lobby bar, restaurant, lounge and a gallery, and
        its own arts programme has brought installations by local designers and
        makers, often tied to the London Design Festival. Screenings sit in its
        events line-up alongside workshops and wellness sessions, each put on by
        an outside host.
      </p>
    </section>
  );
}

export const seoDescription =
  "Shoreditch hotel with a cultural events programme";
export const seoHighlights = "hosted film screenings, workshops and art";

export default VenueBlurb;
