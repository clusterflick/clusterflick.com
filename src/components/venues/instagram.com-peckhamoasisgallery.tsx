import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Peckham Oasis Gallery is a gallery space in a pair of units on the
        Dovedale Trading Estate in Peckham,{" "}
        <Link href="/london-cinemas/southwark/">Southwark</Link>. It has no
        website of its own and announces what&apos;s on through its Instagram,
        with events listed for booking on Luma.
      </p>
      <p>
        Its programme centres on exhibitions, often with workshops and talks
        running alongside them, and film has joined that mix: screenings here
        are one-off events in the gallery rather than a regular cinema schedule.
      </p>
    </section>
  );
}

export const seoDescription = "Gallery space on a Peckham trading estate";
export const seoHighlights = "exhibitions, talks and occasional film nights";

export default VenueBlurb;
