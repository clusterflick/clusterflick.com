import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        A House for Artists is a building on Linton Road in Barking town centre,{" "}
        <Link href="/london-cinemas/barking-and-dagenham/">
          Barking and Dagenham
        </Link>
        , with affordable homes for artists upstairs. Commissioned by the
        council and Create London, it was built so that the artists living there
        would work with local people, and its design has won a RIBA award.
      </p>
      <p>
        The ground floor holds studios and a community space called The Living
        Room, which hosts workshops and events open to the neighbourhood. Its
        community cinema nights are held there too.
      </p>
    </section>
  );
}

export const seoDescription = "artists' housing and community space in Barking";
export const seoHighlights = "community cinema nights in The Living Room";

export default VenueBlurb;
