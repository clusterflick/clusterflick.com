import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Whitton Library is a public library on Nelson Road in{" "}
        <Link href="/london-cinemas/richmond-upon-thames/">
          Richmond upon Thames
        </Link>
        , with free wifi, tablets to borrow in the building and an after-hours
        book drop. Attached to it is Whitton Library Community Space, a modern
        room with its own kitchenette that is available to hire for events and
        meetings.
      </p>
      <p>
        That space hosts the TW2 Independent Film Festival, bringing short
        independent film to the library alongside its regular sessions and
        one-off community events.
      </p>
    </section>
  );
}

export const seoDescription = "Whitton public library and community space";
export const seoHighlights = "TW2 Independent Film Festival and shorts";

export default VenueBlurb;
