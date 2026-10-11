import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        EbonyLife Place London calls itself &quot;The Home of Black &amp;
        African Culture in London&quot;, a destination on Wandsworth Road in{" "}
        <Link href="/london-cinemas/lambeth/">Lambeth</Link>, near Nine Elms,
        where &quot;Africa&apos;s stories, flavours, creativity and community
        come together&quot;. Modelled on Mo Abudu&apos;s EbonyLife Place in
        Lagos, it pairs film with The Afrobeat restaurant, a cocktail lounge, a
        retail space and African contemporary art throughout.
      </p>
      <p>
        Film is shown in the Amani Auditorium, named for the Swahili word for
        peace and described as &quot;a dedicated space celebrating the richness,
        diversity and global influence of Black and African cinema&quot;. The
        venue programmes its own screenings, centred on Nollywood, African
        filmmaking and Black British, Caribbean and diaspora stories, with
        premieres, Q&amp;As and masterclasses alongside.
      </p>
    </section>
  );
}

export const seoDescription =
  "Wandsworth Road home of Black and African culture";
export const seoHighlights =
  "Nollywood, African and diaspora cinema, premieres and Q&As";

export default VenueBlurb;
