import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The BFI London Film Festival is the UK&rsquo;s biggest film event, and
        the oldest of the festivals the British Film Institute runs. It came out
        of a 1957 dinner party at the house of <em>Sunday Times</em> critic
        Dilys Powell, and its first edition ran that October at the newly opened
        National Film Theatre &mdash; now{" "}
        <Link href="/venues/bfi-southbank">BFI Southbank</Link> &mdash; with a
        programme of around twenty films already acclaimed elsewhere, opening
        with Kurosawa&rsquo;s <em>Throne of Blood</em>. It grew from that
        &ldquo;festival of festivals&rdquo; into a two-week showcase of several
        hundred features and shorts from more than seventy countries, and the
        Sutherland Trophy it has awarded since 1958 &mdash; for the most
        original and imaginative first feature &mdash; has gone to Satyajit Ray,
        Bernardo Bertolucci and Jean-Luc Godard, among others.
      </p>
      <p>
        The 70th edition runs 7 to 18 October 2026 under the line
        &ldquo;everyone is invited&rdquo;, bringing more than 250 new films to
        London and to partner cinemas around the UK. The galas are at the
        Southbank Centre&rsquo;s Royal Festival Hall &mdash; opening with the
        European premiere of Simon Stone&rsquo;s <em>Elsinore</em> and closing
        with the UK premiere of Jesse Eisenberg&rsquo;s <em>The Debut</em>{" "}
        &mdash; with the competition programme, the Screen Talks and the free
        events at BFI Southbank, the biggest screenings at{" "}
        <Link href="/venues/bfi-imax">BFI IMAX</Link>, and the rest split
        between four West End partners:{" "}
        <Link href="/venues/curzon-soho">Curzon Soho</Link>, the{" "}
        <Link href="/venues/institute-of-contemporary-arts">ICA</Link>, the{" "}
        <Link href="/venues/prince-charles-cinema">Prince Charles Cinema</Link>{" "}
        and <Link href="/venues/vue-west-end">Vue West End</Link>. Films are
        grouped into strands rather than genres &mdash; Love, Debate, Laugh,
        Dare, Thrill, Cult, Journey, Create, Experimenta, Family, Treasures and
        Expanded &mdash; alongside the official competition, the first feature
        and documentary competitions, and the Best British Newcomer award.
      </p>
    </section>
  );
}

export const seoDescription =
  "the UK's biggest film event, running every October since 1957 and now bringing more than 250 new films to the South Bank and the West End";
export const seoHighlights =
  "gala premieres at the Royal Festival Hall, the official and first feature competitions, Screen Talks and the Love, Debate, Dare and Experimenta strands";

export default FestivalBlurb;
