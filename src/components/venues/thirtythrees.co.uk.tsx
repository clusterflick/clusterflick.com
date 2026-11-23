import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        33&apos;s The Old Grocery Store is a café, cocktail bar and bakery on
        Salisbury Road, on the Harringay Ladder in{" "}
        <Link href="/london-cinemas/haringey/">Haringey</Link>. It calls itself
        &quot;more than just a café&quot; and &quot;a community hub where
        vintage charm meets modern comfort&quot;: a cosy room of exposed brick
        and wooden furniture, serving coffee and brunch by day before turning
        into a cocktail bar as the evening comes on.
      </p>
      <p>
        It describes itself as a welcoming neighbourhood spot and an LGBTQ+
        friendly space. Film comes in from outside: the screenings are hosted by
        groups who take over the room for an evening, between the café&apos;s
        everyday trade.
      </p>
    </section>
  );
}

export const seoDescription =
  "neighbourhood café and cocktail bar on the Harringay Ladder";
export const seoHighlights = "community-run evening screenings";

export default VenueBlurb;
