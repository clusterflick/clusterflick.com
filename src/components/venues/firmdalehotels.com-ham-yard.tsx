import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Ham Yard Hotel is a Kit Kemp-designed hotel a three-minute walk from
        Piccadilly Circus, in the{" "}
        <Link href="/london-cinemas/westminster/">Westminster</Link> part of
        Soho, and part of the Firmdale Hotels group. It describes itself as
        &quot;a celebration of contemporary art, craft and design&quot;, with a
        rooftop garden, a library and an original 1950s bowling alley in The
        Croc.
      </p>
      <p>
        Film happens in its theatre, which the hotel calls &quot;a 190-seat
        cinema for screenings and lively presentations&quot;. Screenings here
        are put on by outside organisers hiring the room, from festival galas to
        one-off events, so what&apos;s on changes with whoever is programming
        the night.
      </p>
    </section>
  );
}

export const seoDescription = "Soho hotel with a 190-seat screening theatre";
export const seoHighlights = "festival galas and hired-in film screenings";

export default VenueBlurb;
