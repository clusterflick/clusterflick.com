import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The Shortest Nights is a BIFA-qualifying short film festival run by
        Short Sighted Cinema, a non-profit set up on the conviction that
        &ldquo;British short film is an exciting art form that too often goes
        ignored&rdquo;. The organisation began as a short film club and works to
        bring independent British cinema to new audiences, particularly those of
        working class and global majority backgrounds, reinvesting what it makes
        back into its exhibition events.
      </p>
      <p>
        Now in its 12th year, the festival showcases the best in up-and-coming
        British filmmaking talent across programmes spanning comedy, drama,
        animation, horror and family films, each screening paired with a Q&amp;A
        and jury award presentations. The 2026 edition runs across the weekend
        of 5–6 September at{" "}
        <Link href="/venues/the-castle-sidcup">The Castle Sidcup</Link>.
      </p>
    </section>
  );
}

export const seoDescription =
  "a BIFA-qualifying festival of new British short films from Short Sighted Cinema, now in its 12th year";
export const seoHighlights =
  "short film programmes spanning comedy, drama, animation, horror and family, with Q&As and jury awards at The Castle Sidcup";

export default FestivalBlurb;
