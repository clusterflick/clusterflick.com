import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        North Kensington Library is a public library on Ladbroke Grove, run by
        the Royal Borough of{" "}
        <Link href="/london-cinemas/kensington-and-chelsea/">
          Kensington and Chelsea
        </Link>
        . Alongside its lending collections it holds local studies and archive
        material, has space available to hire, and runs regular events for
        adults and activities for children and young people.
      </p>
      <p>
        Its film club screens films for the neighbourhood, including seasons
        marking occasions such as East and South East Asian Heritage Month.
      </p>
    </section>
  );
}

export const seoDescription = "public library and film club on Ladbroke Grove";
export const seoHighlights = "community film club and heritage month seasons";

export default VenueBlurb;
