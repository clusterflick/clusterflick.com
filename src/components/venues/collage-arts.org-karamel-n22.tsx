import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Karamel N22 is the vegan restaurant, bar and events venue at the heart
        of Collage Arts&apos; studios in Wood Green&apos;s Cultural Quarter,{" "}
        <Link href="/london-cinemas/haringey/">Haringey</Link>. Collage Arts is
        an arts development charity that has spent 40 years widening access to
        the arts, and Karamel is where much of its public programme happens.
      </p>
      <p>
        The venue hosts live music from jazz to new bands, alongside theatre,
        spoken word, exhibitions and family days, and serves vegan food
        including Sunday roasts. Its movie nights are informal affairs,
        including dog-friendly screenings where audiences can bring their pets.
      </p>
    </section>
  );
}

export const seoDescription = "vegan restaurant and arts venue in Wood Green";
export const seoHighlights = "informal and dog-friendly movie nights";

export default VenueBlurb;
