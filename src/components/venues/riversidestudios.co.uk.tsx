import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Riverside Studios is an arts and entertainment complex on Queen Caroline
        Street in{" "}
        <Link href="/london-cinemas/hammersmith-and-fulham/">Hammersmith</Link>,
        West London. With a history stretching back to the 1930s as a film and
        television studio, the venue has long been associated with the screen
        arts. The modern, rebuilt complex features cinema screens, theatre and
        performance spaces, a bar, and a restaurant. Its cinema programme offers
        a mix of mainstream, independent, arthouse, and classic films alongside
        special screenings and events.
      </p>
    </section>
  );
}

export const seoDescription = "Hammersmith arts complex with cinema screens";
export const seoHighlights =
  "mainstream, independent, arthouse and classic films";

export default VenueBlurb;
