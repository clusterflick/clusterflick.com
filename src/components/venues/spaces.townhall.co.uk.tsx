import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Camden Town Hall on Judd Street, facing St Pancras in{" "}
        <Link href="/london-cinemas/camden/">Camden</Link>, was completed in
        1937. After &quot;a meticulous eight-year restoration led by Purcell
        architects&quot;, its marble staircases, terrazzo floors and brass
        fittings now sit alongside new interiors by Tom Dixon.
      </p>
      <p>
        Its event spaces, entered from Bidborough Street and run as Town Hall
        Spaces, include the Grade II listed Vision Hall, Inner Space and The
        Network, and screenings here are events that hire those rooms.
      </p>
    </section>
  );
}

export const seoDescription =
  "restored 1930s town hall and event spaces in King's Cross";
export const seoHighlights = "screenings in Camden Town Hall's event spaces";

export default VenueBlurb;
