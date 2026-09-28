import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Central Saint Martins is the University of the Arts London&apos;s art
        and design college, on Granary Square in King&apos;s Cross,{" "}
        <Link href="/london-cinemas/camden/">Camden</Link>. It describes itself
        as &quot;rethinking what an art and design college should focus on and
        how this might work&quot;, with studios and workshops shared across its
        disciplines.
      </p>
      <p>
        Its screenings take place in the Platform Theatre, a flexible 350-seat
        theatre and bar that is the college&apos;s main public performance
        space. As well as staged productions and dance, it hosts film and video
        presentations and experimental projection work from students and
        graduates, and public nights such as animation showcases.
      </p>
    </section>
  );
}

export const seoDescription = "UAL art and design college in King's Cross";
export const seoHighlights =
  "film and animation screenings in the Platform Theatre";

export default VenueBlurb;
