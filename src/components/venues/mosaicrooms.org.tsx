import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Mosaic Rooms is a gallery and bookshop on Cromwell Road in{" "}
        <Link href="/london-cinemas/kensington-and-chelsea/">
          Kensington and Chelsea
        </Link>
        . Founded in 2008 by the A.M. Qattan Foundation and now an independent
        charity, it &quot;supports and amplifies contemporary culture from the
        Arab world and beyond&quot;.
      </p>
      <p>
        Exhibitions run alongside artist takeovers, study groups, workshops and
        a play room for children. Screenings are programmed by the Rooms itself
        and listed among those events.
      </p>
    </section>
  );
}

export const seoDescription =
  "Cromwell Road gallery for contemporary culture from the Arab world";
export const seoHighlights = "its own film screenings, exhibitions and talks";

export default VenueBlurb;
