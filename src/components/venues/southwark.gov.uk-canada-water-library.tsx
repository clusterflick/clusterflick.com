import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Canada Water Library stands beside the plaza at Canada Water in{" "}
        <Link href="/london-cinemas/southwark/">Southwark</Link>, an
        inverted-pyramid building by CZWG that opened in 2011 as the centrepiece
        of the area&apos;s regeneration.
      </p>
      <p>
        Its single large library floor sits at the top of the building beneath
        rows of skylights, with a café and a 150-seat culture space below. The
        library runs a packed weekly programme for children and families, from
        coding clubs to Dungeons and Dragons, and its film club and special
        screenings are part of that programme.
      </p>
    </section>
  );
}

export const seoDescription = "Canada Water's inverted-pyramid library";
export const seoHighlights = "film club and special screenings";

export default VenueBlurb;
