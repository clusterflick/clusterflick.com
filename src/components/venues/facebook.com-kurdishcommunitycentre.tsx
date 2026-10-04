import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Kurdish Community Centre is on Portland Gardens in Harringay, in{" "}
        <Link href="/london-cinemas/haringey/">Haringey</Link>, a few streets
        from Green Lanes. Haringey Council&apos;s directory describes it as a
        &quot;reception centre for Kurdish refugees&quot;, offering
        &quot;language classes and other services to help Kurdish refugees
        settle in London&quot;.
      </p>
      <p>
        It is also a social hub for the community, with food and drink served
        daily, and it hosts cultural events, among them film screenings open to
        the wider neighbourhood.
      </p>
    </section>
  );
}

export const seoDescription = "Kurdish community centre in Harringay";
export const seoHighlights = "free community film screenings";

export default VenueBlurb;
