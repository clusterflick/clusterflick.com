import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        New Malden Library on Kingston Road is a Grade II listed public library
        in <Link href="/london-cinemas/kingston-upon-thames/">Kingston</Link>,
        opened in 1941. Its brick and stone building keeps much of its original
        woodwork, a first-floor lecture room with a stage, and nine plaques by
        Thomas Mewburn Crook for the main divisions of the Dewey Decimal system.
      </p>
      <p>
        Alongside books, a study area and free computers, it hosts community
        events organised by local groups, screenings among them, which are
        listed in the council&apos;s events calendar.
      </p>
    </section>
  );
}

export const seoDescription =
  "Grade II listed 1940s public library in New Malden";
export const seoHighlights = "community screenings in a listed library";

export default VenueBlurb;
