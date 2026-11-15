import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        St John&apos;s Waterloo, the church of St John the Evangelist, stands by
        the roundabout on Waterloo Road in{" "}
        <Link href="/london-cinemas/lambeth/">Lambeth</Link>, a short walk from
        Waterloo station. Gutted by a firebomb in the Second World War, it
        reopened as the church of the Festival of Britain in 1951, and again in
        October 2022 after a £5.5 million restoration of the Grade II* building
        led by Eric Parry Architects. It describes itself as &quot;an inclusive
        church&quot;.
      </p>
      <p>
        Alongside its worship, St John&apos;s is a music and arts venue: it runs
        the Waterloo Festival every summer and hosts orchestras, choirs,
        exhibitions in the Old Crypt and theatre through the year. Its spaces
        are also hired out to arts groups and charities, and the screenings held
        here come from them.
      </p>
    </section>
  );
}

export const seoDescription =
  "Grade II* Waterloo church and South Bank music and arts venue";
export const seoHighlights = "screenings from arts groups and charities";

export default VenueBlurb;
