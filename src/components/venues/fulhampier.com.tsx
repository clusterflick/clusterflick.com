import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Fulham Pier is a riverside bar and events venue on Stevenage Road in{" "}
        <Link href="/london-cinemas/hammersmith-and-fulham/">Fulham</Link>,
        Southwest London, situated on the banks of the Thames adjacent to Craven
        Cottage, home of Fulham FC. Alongside its regular bar and dining
        operation, the venue occasionally hosts outdoor and indoor film
        screenings as part of its events programme, taking advantage of its
        waterside setting.
      </p>
    </section>
  );
}

export const seoDescription = "riverside Fulham bar with film events";
export const seoHighlights =
  "outdoor screenings, waterside cinema and seasonal events";

export default VenueBlurb;
