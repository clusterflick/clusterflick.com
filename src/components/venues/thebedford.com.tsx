import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Bedford is a pub, restaurant, live music venue and hotel on Bedford
        Hill in Balham,{" "}
        <Link href="/london-cinemas/wandsworth/">Wandsworth</Link>. Built in
        1931 and since restored, it holds five bars, a restaurant, a Ballroom
        and the Club Room, whose stage has hosted early shows by Ed Sheeran, Sam
        Smith, Eddie Izzard and Michael McIntyre.
      </p>
      <p>
        Its programme takes in live music, comedy and club nights, and the
        venue&apos;s rooms also host film club screenings and film events.
      </p>
    </section>
  );
}

export const seoDescription =
  "Balham pub, live music venue and hotel with a storied stage";
export const seoHighlights = "film club screenings, live music and comedy";

export default VenueBlurb;
