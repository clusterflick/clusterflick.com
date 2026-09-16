import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Folklore is a live music venue on Hackney Road, on the{" "}
        <Link href="/london-cinemas/tower-hamlets/">Tower Hamlets</Link> side of
        the Hoxton and Haggerston borders, which has been running since 2014. It
        calls itself &quot;a live music venue with a difference&quot;, built
        around a contemporary interpretation of ancient wisdom, and sets out to
        connect emerging performers directly with audiences rather than going
        through the usual industry gatekeepers.
      </p>
      <p>
        Its programme runs to live music, DJ nights, ceremonies and talks, with
        a members&apos; scheme called Folk of Lore, and food and drink served
        alongside the shows. Film turns up as part of that wider mix: the
        screenings here are put on by outside promoters hiring the space, so
        what&apos;s on changes with whoever is programming the night.
      </p>
    </section>
  );
}

export const seoDescription =
  "independent Hackney Road live music venue since 2014";
export const seoHighlights = "promoter-led film nights, live music and DJs";

export default VenueBlurb;
