import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Grosvenor Chapel stands on South Audley Street in Mayfair,{" "}
        <Link href="/london-cinemas/westminster/">Westminster</Link>, opposite
        the Mayfair Library. Ready by 1731, it is a plain classical brick
        building with a portico and short spire, galleries on three sides and a
        white barrel-vaulted interior, with the altar end remodelled by Ninian
        Comper in 1912. It calls itself &quot;a congenial Anglican place of
        worship in central London&quot;.
      </p>
      <p>
        The chapel was a filming location for Love Actually, and that film and
        other festive favourites have been screened inside it as part of the
        surrounding neighbourhood&apos;s Christmas festivities.
      </p>
    </section>
  );
}

export const seoDescription =
  "Georgian Anglican chapel in Mayfair, a Love Actually filming location";
export const seoHighlights = "festive film screenings in the chapel";

export default VenueBlurb;
