import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Thomas Wall Centre is a community centre on Benhill Avenue in{" "}
        <Link href="/london-cinemas/sutton/">Sutton</Link>, South London. The
        centre hosts a range of community activities and events, including
        regular film screenings as part of its cultural programme for the local
        area.
      </p>
    </section>
  );
}

export const seoDescription = "Sutton community centre with regular screenings";
export const seoHighlights = "community film screenings and local events";

export default VenueBlurb;
