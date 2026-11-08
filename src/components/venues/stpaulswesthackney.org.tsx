import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        St Paul&apos;s West Hackney is the Anglican parish church on Stoke
        Newington Road in <Link href="/london-cinemas/hackney/">Hackney</Link>,
        serving a parish that was created in 1824. It describes itself as
        &quot;a welcoming, outward-facing church, deeply involved in local
        community life&quot;, and next door is West Hackney Recreation Ground, a
        former burial ground turned public garden.
      </p>
      <p>
        The church hall is busy through the week with groups that use it, from
        choirs and dance nights for older residents to a drop-in for people who
        are homeless, and an organic farmers&apos; market sets up at the church
        every Saturday. Its film screenings come from local groups too.
      </p>
    </section>
  );
}

export const seoDescription = "Stoke Newington Road parish church in Hackney";
export const seoHighlights = "community film screenings and events";

export default VenueBlurb;
