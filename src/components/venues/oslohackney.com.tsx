import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Oslo is a bar, restaurant and live music venue on Amhurst Road in{" "}
        <Link href="/london-cinemas/hackney/">Hackney</Link>, housed in the
        listed Victorian building that was once Hackney Central railway station.
        Opened in 2014 and run by DHP Family, it pairs a ground-floor bar and
        kitchen with a 375-capacity gig room upstairs.
      </p>
      <p>
        Between the live music and club nights, Oslo screens films in the
        upstairs room &mdash; including Weeknight Tapes, a series of concert
        films and music documentaries.
      </p>
    </section>
  );
}

export const seoDescription =
  "Hackney bar and live music venue in the old railway station";
export const seoHighlights =
  "concert film screenings, live music and club nights";

export default VenueBlurb;
