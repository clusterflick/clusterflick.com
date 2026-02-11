import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Kensington Central Library is a public library on Phillimore Walk in
        Kensington, West London, run by the Royal Borough of{" "}
        <Link href="/london-cinemas/kensington-and-chelsea/">
          Kensington and Chelsea
        </Link>
        . Alongside its library services, the venue hosts a community cinema
        programme offering regular film screenings in an accessible, affordable
        setting for the local community.
      </p>
    </section>
  );
}

export const seoDescription = "community cinema in Kensington library";
export const seoHighlights = "community screenings and affordable local cinema";

export default VenueBlurb;
