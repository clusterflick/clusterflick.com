import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Green Alley Studios is a shared studio space for creatives on Cambridge
        Heath Road in Bethnal Green,{" "}
        <Link href="/london-cinemas/tower-hamlets/">Tower Hamlets</Link>, run by
        a group of artists who work out of it and open it up to visitors.
      </p>
      <p>
        The studio puts on exhibitions of work made there and lends the room to
        one-off events, among them film nights run by visiting clubs &mdash;
        such as the Food &amp; Film Club, a potluck where everyone brings a dish
        to share and the group watches a film about food.
      </p>
    </section>
  );
}

export const seoDescription =
  "Artist-run studio space and events room in Bethnal Green";
export const seoHighlights = "exhibitions and occasional film nights";

export default VenueBlurb;
