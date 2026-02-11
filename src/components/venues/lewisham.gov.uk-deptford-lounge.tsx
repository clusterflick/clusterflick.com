import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Deptford Lounge is a public library and community hub on Giffin Street
        in Deptford, Southeast London, run by{" "}
        <Link href="/london-cinemas/lewisham/">Lewisham</Link> Council.
        Alongside its library services, the venue hosts the Deptford Library
        Cinema Club, a regular community cinema programme screening a mix of
        mainstream, independent, and classic films. It provides a free or
        low-cost cinema experience in an accessible community setting.
      </p>
    </section>
  );
}

export const seoDescription = "Deptford library community cinema club";
export const seoHighlights =
  "free and low-cost screenings, mainstream and classic films";

export default VenueBlurb;
