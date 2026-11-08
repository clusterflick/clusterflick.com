import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Museum of Youth Culture calls itself &quot;the world&apos;s first museum
        dedicated to the lives of teenagers and young people&quot;. Its
        permanent home is on St Pancras Way in{" "}
        <Link href="/london-cinemas/camden/">Camden</Link>, with four exhibition
        spaces telling the story of growing up in Britain through everyday
        voices.
      </p>
      <p>
        A not-for-profit with what it describes as a rebellious spirit, it also
        opens its doors in the evenings for private views, panels and DJ sets.
        Screenings come from the museum working with outside collectives and
        producers, in a screening room on site.
      </p>
    </section>
  );
}

export const seoDescription =
  "Camden museum dedicated to teenagers and young people";
export const seoHighlights = "screenings with outside collectives";

export default VenueBlurb;
