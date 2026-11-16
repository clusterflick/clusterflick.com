import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Pedaller&apos;s Corner is a café tucked into the corner of London Bike
        Studio, a bike shop on Stoke Newington Road in{" "}
        <Link href="/london-cinemas/hackney/">Hackney</Link>. It calls itself a
        &quot;café &amp; community hub&quot;, and a place to &quot;meet &amp;
        greet, think &amp; create, watch &amp; learn, laugh &amp; cry&quot;.
      </p>
      <p>
        After hours the café opens for events, and invites people to bring their
        own, from folk nights and book launches to jumble sales and supper
        clubs. It has no film programme of its own: its screenings are put on by
        film clubs that take over the room for an evening.
      </p>
    </section>
  );
}

export const seoDescription =
  "Stoke Newington café and community hub in the corner of a bike shop";
export const seoHighlights = "film club screenings in a neighbourhood café";

export default VenueBlurb;
