import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        London College of Communication is the University of the Arts
        London&apos;s college at Elephant and Castle, in{" "}
        <Link href="/london-cinemas/southwark/">Southwark</Link>, on a single
        site teaching subjects from illustration and data visualisation to user
        experience design. It sets out to &quot;address the societal issues of
        our time with courage and imagination&quot; through its education and
        research.
      </p>
      <p>
        Its lecture theatres and gallery spaces open to the public for
        screenings, book launches and Q&amp;As, often with the filmmakers in the
        room, alongside showcases of its own students&apos; work.
      </p>
    </section>
  );
}

export const seoDescription =
  "UAL college of design, media and communication at Elephant and Castle";
export const seoHighlights = "documentary screenings with filmmaker Q&As";

export default VenueBlurb;
