import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        BFI Stephen Street is a BFI facility that houses member-only screening
        rooms used primarily for exclusive member screenings, industry events,
        and film festivals. Unlike{" "}
        <Link href="/venues/bfi-southbank">BFI Southbank</Link>&apos;s public
        cinema, Stephen Street operates as a more intimate, private venue where
        BFI Members can enjoy monthly member poll screenings, special previews,
        and curated seasons in smaller screening spaces. The building also
        serves as a base for BFI&apos;s archival and educational work,
        occasionally hosting film festivals like Doc.London and NFTS events
        focused on film programming and curation.
      </p>
      <p>
        While not open to the general public for regular cinema programming,
        Stephen Street plays an important role in the BFI ecosystem as a space
        for member benefits, industry screenings, and festival events that
        complement the main programming at{" "}
        <Link href="/venues/bfi-southbank">BFI Southbank</Link>. The venue
        offers a more exclusive, boutique cinema experience for those deeply
        engaged with the BFI&apos;s mission, with screenings typically announced
        through member communications rather than public listings.
      </p>
    </section>
  );
}

export default VenueBlurb;
