import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Ognisko Polskie, the Polish Hearth Club, is a members&apos; club on
        Princes Gate in South Kensington,{" "}
        <Link href="/london-cinemas/westminster/">Westminster</Link>, and
        &quot;an important part of Polish Social and Cultural life in
        London&quot;. It opened in 1939 at the start of the Second World War,
        founded on the combined initiative of the British and Polish
        governments, and was inaugurated by the Duke of Kent in 1940.
      </p>
      <p>
        Set in a Grade II listed Victorian house completed around 1870, the club
        became the hub of Polish life in exile, with a restaurant, meeting
        rooms, a ballroom and a theatre that drew queues out onto Exhibition
        Road on performance nights. It has served the Polish community and its
        friends ever since.
      </p>
      <p>
        Film sits alongside the concerts, talks and exhibitions: KinoKlub
        showcases recent Polish cinema in the club&apos;s ballroom, with a
        pre-film dinner available in the restaurant and a glass of wine after
        the screening.
      </p>
    </section>
  );
}

export const seoDescription =
  "South Kensington Polish members' club, open since 1939";
export const seoHighlights =
  "KinoKlub screenings of recent Polish cinema, concerts and talks";

export default VenueBlurb;
