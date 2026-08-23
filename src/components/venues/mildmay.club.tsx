import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Mildmay Club is a members&apos; social club on Newington Green in{" "}
        <Link href="/london-cinemas/hackney/">Hackney</Link>, &quot;radical
        since 1888&quot;. It opened that year as the Mildmay Radical Club on
        Newington Green Road, drawing complaints from the vicar of nearby St
        Matthias about its &quot;pernicious influence among the young&quot;,
        moved to the Green in 1894, and in 1900 took up the Grade II listed
        clubhouse it still occupies, designed by member and architect Alfred
        Allen. The &quot;Radical&quot; tag was dropped in 1930.
      </p>
      <p>
        At its peak the club had over 3,000 members and regular music hall
        entertainments, and its Main Hall, Tartan Bar and snooker hall have
        since become a familiar backdrop on screen — in films about the Krays,
        in Vera Drake and Made in Dagenham, and in music videos for Oasis, Franz
        Ferdinand and Florence &amp; The Machine.
      </p>
      <p>
        The programme today runs from sports and games to classes, club nights
        and live music, with the occasional film screening among it.
      </p>
    </section>
  );
}

export const seoDescription =
  "Newington Green members' social club, radical since 1888";
export const seoHighlights =
  "occasional film screenings, live music and club nights";

export default VenueBlurb;
