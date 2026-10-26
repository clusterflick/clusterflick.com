import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Biddle Bros is a live music bar at 88 Lower Clapton Road in Clapton,{" "}
        <Link href="/london-cinemas/hackney/">Hackney</Link>, which bills itself
        as &quot;East London&apos;s worst kept secret&quot;. It sits in a former
        builders&apos; merchants and has kept the old shopfront, with the Biddle
        Bros name still over the door.
      </p>
      <p>
        Music is the heart of it, with local bands, open mic nights and karaoke
        through the week. Screenings are one-off nights from outside promoters,
        who take over the bar for the evening.
      </p>
    </section>
  );
}

export const seoDescription = "Lower Clapton Road live music bar in Hackney";
export const seoHighlights = "promoter-run film nights, live bands and karaoke";

export default VenueBlurb;
