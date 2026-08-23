import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Well Walk Theatre is an independent venue on Willow Road in
        Hampstead, <Link href="/london-cinemas/camden/">Camden</Link>, which
        describes itself as &quot;dedicated to high-quality family
        productions&quot;. It combines an intimate 50-seat theatre with a
        children&apos;s bookshop of rare and unusual titles and a cafe open to
        anyone dropping by, show or no show.
      </p>
      <p>
        Every show is produced in-house and set in a vintage universe matching
        the theatre&apos;s Victorian design: glove puppet shows, traditional
        magic, mime, and silent films with live musical accompaniment. Its Cine
        Club screens &quot;rare and distinctive films&quot;, from vintage
        animation to masterpieces of the silent era.
      </p>
    </section>
  );
}

export const seoDescription =
  "Hampstead family theatre with a bookshop and cafe";
export const seoHighlights =
  "silent film with live accompaniment, vintage animation and puppet shows";

export default VenueBlurb;
