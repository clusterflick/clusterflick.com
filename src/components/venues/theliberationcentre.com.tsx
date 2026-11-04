import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Liberation Centre is a youth and community space at Beehive Place in
        Brixton, in <Link href="/london-cinemas/lambeth/">Lambeth</Link>, and
        the home of The Advocacy Academy&apos;s youth organising programmes. It
        moved here from the organisation&apos;s old base on Vining Street, into
        a purpose-built building over two floors that it hopes will be &quot;a
        space for creativity, dreaming, organising, and action for our
        collective liberation&quot;.
      </p>
      <p>
        Inside are big and small meeting rooms, a kitchen with a community
        fridge, a library and a quiet room, with a lift and accessible toilets
        throughout. The centre&apos;s own description of its stairs is that they
        &quot;double as an excellent makeshift cinema&quot;. Screenings here are
        put on by groups booking the space for their own events.
      </p>
    </section>
  );
}

export const seoDescription =
  "Brixton youth and community centre run by The Advocacy Academy";
export const seoHighlights = "community-run film screenings and events";

export default VenueBlurb;
