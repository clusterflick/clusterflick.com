import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Cabbage Patch is a Fuller&apos;s pub on London Road in Twickenham,{" "}
        <Link href="/london-cinemas/richmond-upon-thames/">
          Richmond upon Thames
        </Link>
        , where the high street ends and the River Crane begins, a drop-kick
        from the rugby stadium. It calls itself &quot;the most famous rugby pub
        in the world&quot;, and away from match days it is a local serving food,
        ales and a sizeable whiskey collection.
      </p>
      <p>
        Screenings are upstairs in the 1907, the pub&apos;s top-floor events
        space, which has its own entrance. It is fitted out in a 1920s style,
        with a sunken dance floor, a raised viewing platform, a snug and a
        lounge, along with a stage and a full sound system, and holds between 50
        and 220 people. Film nights there are put on by a local film club that
        hires the room.
      </p>
    </section>
  );
}

export const seoDescription =
  "Twickenham rugby pub with a 1920s-style upstairs events space";
export const seoHighlights = "film club screenings in the 1907 events space";

export default VenueBlurb;
