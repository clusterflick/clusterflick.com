import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Castle Sidcup is an independent, community-driven cinema run by the
        team behind{" "}
        <Link href="/venues/the-castle-cinema">The Castle Cinema</Link> in
        Hackney, reopening in late 2025 after the previous Sidcup Storyteller
        closed. The venue programmes a broad variety of cinematic content
        including the best new releases, outstanding independent films, family
        favourites, and plans to screen cult classics and host film clubs and
        special events. With a cosy, friendly atmosphere and a newly refurbished
        space, the cinema aims to be an invaluable local asset for Sidcup and
        the wider Bexley area.
      </p>
      <p>
        The Castle Sidcup offers a range of accessible and community-focused
        screenings including baby screenings, relaxed screenings for
        neurodiverse audiences, and support for audio description,
        hard-of-hearing subtitles, and amplified audio. The venue is also
        available for private hire, making it possible to book the cinema for
        personal screenings, birthday celebrations, or community events. As an
        independent cinema committed to showing diverse programming at
        competitive prices, it&apos;s a welcoming alternative to chain
        multiplexes for local film lovers.
      </p>
    </section>
  );
}

export default VenueBlurb;
