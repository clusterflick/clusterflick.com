import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Women&apos;s Museum is located at Barking Wharf Square in{" "}
        <Link href="/london-cinemas/barking-and-dagenham/">Barking</Link>, east
        London. It is dedicated to celebrating and preserving the history,
        achievements, and stories of women. Alongside its exhibitions and
        archive, the museum hosts a programme of events including film
        screenings, talks, and workshops that explore women&apos;s history and
        contemporary issues.
      </p>
    </section>
  );
}

export const seoDescription = "museum and cultural space in Barking";
export const seoHighlights = "film screenings, talks and workshops";

export default VenueBlurb;
