import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Gunnersbury Park Museum opened in 1929 in Gunnersbury Park House, the
        former home of the Rothschild family, in the park on Popes Lane in{" "}
        <Link href="/london-cinemas/hounslow/">Hounslow</Link>. Its collection
        of around 50,000 objects and archive items tells the story of the people
        of Ealing and Hounslow.
      </p>
      <p>
        Nine galleries across three floors run from local history to fashion,
        toys and the house&apos;s Victorian kitchens, with favourites like an
        1880s doll&apos;s house and the neon Lucozade sign that once overlooked
        the M4. Its film nights are seasonal, from spooky cinema at Halloween to
        festive films at Christmas.
      </p>
    </section>
  );
}

export const seoDescription = "Rothschild mansion museum in Gunnersbury Park";
export const seoHighlights = "seasonal Halloween and Christmas film nights";

export default VenueBlurb;
