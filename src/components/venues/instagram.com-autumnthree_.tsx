import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Autumn Three is a studio and event space on Autumn Street in Fish
        Island, on the{" "}
        <Link href="/london-cinemas/tower-hamlets/">Tower Hamlets</Link> side of
        Hackney Wick. It describes itself as &quot;a multi-functional studio and
        event space designed for gatherings, workshops, and listening
        sessions&quot;, fitted out with vintage furniture on wheels, sculptural
        lighting and a reclaimed spiral staircase leading up to a mezzanine.
      </p>
      <p>
        Sound is at the heart of it: DJ sets and listening sessions run on a
        proper PA in a stripped-back, warehouse-style room, with large rugs laid
        out for sitting as much as dancing. Film comes in through outside
        promoters putting on their own nights in the space rather than a
        programme of the venue&apos;s own. The main room is six steps down from
        the entrance.
      </p>
    </section>
  );
}

export const seoDescription =
  "Fish Island studio and listening space in Hackney Wick";
export const seoHighlights =
  "promoter-led film nights, DJ sets and listening sessions";

export default VenueBlurb;
