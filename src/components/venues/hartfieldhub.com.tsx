import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Hartfield Hub, formerly PS Spaces, is a pair of studios on Hartfield
        Road, a few minutes from Wimbledon station in{" "}
        <Link href="/london-cinemas/merton/">Merton</Link>. The larger has an
        8m-wide infinity cove, and both have floor-to-ceiling natural light with
        full blackout; it calls itself &quot;a community space and social hub
        &hellip; bringing people together over creativity, culture and
        community.&quot;
      </p>
      <p>
        By day the studios are hired for photo and video shoots, and in the
        evenings for yoga, Pilates, life drawing and a monthly live music night.
        Film comes in the same way: screenings here are put on by clubs hiring
        the space.
      </p>
    </section>
  );
}

export const seoDescription =
  "Wimbledon photo and event studios with an infinity cove";
export const seoHighlights = "film nights from clubs hiring the space";

export default VenueBlurb;
