import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Art Hub Studios is a not-for-profit community interest company,
        &quot;run by artists for artists&quot;, on Stanley Street in New Cross,{" "}
        <Link href="/london-cinemas/lewisham/">Lewisham</Link>. Founded in 1999
        as a framing business, it now provides affordable studios and shared
        facilities for a community of around 350 artists and makers across its
        New Cross and Woolwich sites, with printmaking, ceramics, carpentry and
        darkroom workshops.
      </p>
      <p>
        Its gallery is a reimagined school gymnasium, and the public programme
        runs across exhibitions, courses, outreach and community events. Film
        screenings are part of that mix, including the New Cross + Deptford Free
        Film Festival&apos;s evening of short films chosen through an open call.
      </p>
    </section>
  );
}

export const seoDescription =
  "artist-run studios and gallery on Stanley Street, New Cross";
export const seoHighlights =
  "community film screenings and New Cross + Deptford Free Film Festival shorts";

export default VenueBlurb;
