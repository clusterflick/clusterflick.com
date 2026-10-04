import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Christ Church Surbiton Hill is &quot;a friendly, welcoming, informal
        Anglican evangelical church&quot; on Christ Church Road in Surbiton,{" "}
        <Link href="/london-cinemas/kingston-upon-thames/">Kingston</Link>. Its
        building dates from 1863, when local residents came together to build
        it, and has recently been through the first phase of a renovation called
        Christ Church Renewed.
      </p>
      <p>
        That restoration was meant to make the building &quot;a greater blessing
        to our local community&quot;, and alongside worship it hosts groups for
        all ages, fitness classes and community events, including film
        screenings.
      </p>
    </section>
  );
}

export const seoDescription = "Anglican church and community venue in Surbiton";
export const seoHighlights = "community film screenings in a Victorian church";

export default VenueBlurb;
