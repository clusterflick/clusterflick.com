import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Bush Theatre is a world-renowned home for new writing in
        Shepherd&apos;s Bush,{" "}
        <Link href="/london-cinemas/hammersmith-and-fulham/">West London</Link>.
        Founded in 1972 above a pub on Shepherd&apos;s Bush Green and now housed
        in a beautifully renovated former library on Uxbridge Road, the theatre
        has premiered hundreds of plays and built a reputation for discovering
        and championing unheard voices and new playwrights.
      </p>
      <p>
        Primarily a producing theatre, the Bush occasionally programmes film
        alongside its live work—including film-club evenings and special
        screenings, such as the Arab Film Club&apos;s nights of shorts and
        feature films—hosted in its performance spaces and Library bar.
      </p>
    </section>
  );
}

export const seoDescription =
  "Shepherd's Bush new-writing theatre with occasional film screenings";
export const seoHighlights = "film club nights and special screenings";

export default VenueBlurb;
