import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Nell of Old Drury is a traditional theatre pub on Catherine Street
        in Covent Garden,{" "}
        <Link href="/london-cinemas/westminster/">Westminster</Link>, opposite
        the Theatre Royal Drury Lane. The building dates from 1720, but an inn
        has stood on the site since 1423.
      </p>
      <p>
        It takes its name from Nell Gwynn, and legend has it that a tunnel
        linked the pub to the theatre so that Charles II could visit her unseen.
        Long a haunt of actors after their shows, it hosts screenings in its
        function space, including regular nights of animation.
      </p>
    </section>
  );
}

export const seoDescription = "historic Covent Garden theatre pub";
export const seoHighlights = "animation nights in a Covent Garden pub";

export default VenueBlurb;
