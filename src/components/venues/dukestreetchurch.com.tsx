import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Duke Street Church is an independent evangelical church just off the
        main high street in Richmond,{" "}
        <Link href="/london-cinemas/richmond-upon-thames/">
          Richmond upon Thames
        </Link>
        , with services every Sunday morning and evening. Outside those, its
        building is a set of spaces hired out to the neighbourhood, at
        discounted rates for community groups.
      </p>
      <p>
        The largest is an auditorium holding more than 400, with flexible
        seating downstairs and &quot;fixed cinema-style seats in the
        balcony&quot;, alongside a 150-capacity hall and a lounge with its own
        kitchen. Screenings here come from outside organisers hiring the
        auditorium.
      </p>
    </section>
  );
}

export const seoDescription = "independent church off Richmond high street";
export const seoHighlights = "screenings hosted in a 400-seat auditorium";

export default VenueBlurb;
