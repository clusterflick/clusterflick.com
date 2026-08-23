import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Shoreditch Library is a public library on Hoxton Street in{" "}
        <Link href="/london-cinemas/hackney/">Hackney</Link>, free to join
        whether or not you live in the borough. The building has step-free
        access, a lift and accessible toilets.
      </p>
      <p>
        Alongside its library services it runs a regular events programme, which
        includes a Classic Film Club and National Theatre at the Library
        screenings.
      </p>
    </section>
  );
}

export const seoDescription = "public library and film club on Hoxton Street";
export const seoHighlights =
  "classic film club and National Theatre screenings";

export default VenueBlurb;
