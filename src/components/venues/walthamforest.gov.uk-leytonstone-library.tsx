import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Leytonstone Library is a public library on Church Lane in{" "}
        <Link href="/london-cinemas/waltham-forest/">Waltham Forest</Link>, free
        to join whether or not you live in the borough. Alongside its public
        computers it has three rooms available to hire for functions, meetings
        and parties.
      </p>
      <p>
        The library programmes for children and adults alike — story time, arts
        and crafts, board games, mindful colouring, computer support and
        community coffee mornings — and runs a Kids Film Club among them.
      </p>
    </section>
  );
}

export const seoDescription = "public library on Church Lane, Leytonstone";
export const seoHighlights = "kids film club and family activities";

export default VenueBlurb;
