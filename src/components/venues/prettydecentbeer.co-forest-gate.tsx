import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Forest Gate Arch is where Pretty Decent started: its &quot;original spot
        (and former brewery!)&quot;, tucked inside a cosy railway arch on
        Sheridan Road in{" "}
        <Link href="/london-cinemas/waltham-forest/">Waltham Forest</Link>. The
        beer is now brewed at Blackhorse Road and cycled over by bike courier to
        its 12 taps, and sourdough pizzas come from the arch next door.
      </p>
      <p>
        It calls itself a proper neighbourhood spot where everyone is welcome.
        The brewery&apos;s free Sunday Movie Club runs here too, with a title of
        its own for the arch.
      </p>
    </section>
  );
}

export const seoDescription =
  "Pretty Decent's original taproom, in a Forest Gate railway arch";
export const seoHighlights = "free Sunday Movie Club";

export default VenueBlurb;
