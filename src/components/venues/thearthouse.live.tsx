import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Art House is a converted warehouse on Pritchard&apos;s Road, at the
        end of Broadway Market in{" "}
        <Link href="/london-cinemas/tower-hamlets/">Tower Hamlets</Link>, run by
        the creative studio Acrylicize. It calls itself &quot;East-London&apos;s
        most versatile event space&quot; and is dedicated to supporting
        contemporary arts and culture.
      </p>
      <p>
        The open-plan building has a gallery, a lounge, breakout areas and a
        hidden outdoor space, with two large projection screens and a built-in
        speaker system. Screenings come from the outside partners who bring
        their own events and programmes here, alongside exhibitions, talks and
        workshops.
      </p>
    </section>
  );
}

export const seoDescription =
  "converted warehouse event space near Broadway Market";
export const seoHighlights = "partner-run screenings, exhibitions and talks";

export default VenueBlurb;
