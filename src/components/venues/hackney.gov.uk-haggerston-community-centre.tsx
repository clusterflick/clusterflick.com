import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Haggerston Community Centre is a council-run centre on Lovelace Street
        in <Link href="/london-cinemas/hackney/">Hackney</Link>, a three-minute
        walk from Haggerston Overground station. Hackney Council describes it as
        &quot;a large, modern centre over two floors&quot;: a bright
        ground-floor main hall for up to 100, a meeting room and IT suite
        upstairs reached by lift, and a large industrial catering kitchen
        opening onto the hall through a serving hatch.
      </p>
      <p>
        A projector and screen come with the main hall as part of the hire, and
        the screenings there are put on by the community groups and
        organisations who book the room.
      </p>
    </section>
  );
}

export const seoDescription =
  "council-run community centre near Haggerston station in Hackney";
export const seoHighlights = "community film screenings";

export default VenueBlurb;
