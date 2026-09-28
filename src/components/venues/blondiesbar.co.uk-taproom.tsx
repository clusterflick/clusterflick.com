import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Blondies Brewery is the Leyton brewery and taproom of Blondies, the bar
        set up by three Australian sisters in Clapton nearly a decade ago. It
        sits on Church Road in{" "}
        <Link href="/london-cinemas/waltham-forest/">Waltham Forest</Link>, part
        of the Patchworks complex, and Blondies calls itself &quot;not just a
        bar and a brewery—it&apos;s a cultural hub&quot;.
      </p>
      <p>
        The taproom runs a daytime café alongside the bar, and its stage hosts
        live music with a leaning towards rock, metal and alternative acts. Film
        nights fit the same spirit, with seasons of horror and cult films shown
        in the taproom.
      </p>
    </section>
  );
}

export const seoDescription = "Leyton brewery, taproom and live music venue";
export const seoHighlights =
  "horror and cult film seasons in a brewery taproom";

export default VenueBlurb;
