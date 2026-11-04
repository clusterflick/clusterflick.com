import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Norrøna Flagship Store London is the Norwegian outdoor clothing
        brand&apos;s shop on Regent Street in{" "}
        <Link href="/london-cinemas/westminster/">Westminster</Link>, stocking
        its range for skiing, hiking, mountain biking and more.
      </p>
      <p>
        Its evening events are open to all, from talks with mountain guides and
        the brand&apos;s athletes to adventure nights and ski and snowboard film
        screenings such as the Norrøna Freeride Film Tour.
      </p>
    </section>
  );
}

export const seoDescription =
  "Norwegian outdoor brand's flagship store on Regent Street";
export const seoHighlights = "ski and snowboard film nights";

export default VenueBlurb;
