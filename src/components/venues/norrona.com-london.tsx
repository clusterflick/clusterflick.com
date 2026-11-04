import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Norrøna is a Norwegian outdoor clothing brand, and its London flagship
        store is at 15 Regent Street in{" "}
        <Link href="/london-cinemas/westminster/">Westminster</Link>, selling
        its range for skiing, hiking, mountain biking and more.
      </p>
      <p>
        The store hosts evening events that are open to all, among them ski and
        snowboard film nights: the Norrøna Freeride Film Tour, and a screening
        of TGR&apos;s annual ski film.
      </p>
    </section>
  );
}

export const seoDescription =
  "Norwegian outdoor brand's flagship store on Regent Street";
export const seoHighlights = "ski and snowboard film nights";

export default VenueBlurb;
