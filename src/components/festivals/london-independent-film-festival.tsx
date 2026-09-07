import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The London Independent Film Festival is, in its own words,
        &ldquo;devoted to the advancement of first- and second-time filmmakers
        telling amazing stories with limited budgets&rdquo;. Founded in 2004 by
        Erich Schultz, it has spent over twenty years bringing London the best
        of international independent cinema, and Time Out has called it &ldquo;a
        treasure trove of undiscovered cinematic gems, one of Europe&rsquo;s top
        indie film fests&rdquo;.
      </p>
      <p>
        Unusually, LIFF runs twice a year &mdash; a spring edition and an autumn
        one &mdash; and both are hosted at the{" "}
        <Link href="/venues/genesis-cinema">Genesis Cinema</Link> on Mile End
        Road, which the festival describes as &ldquo;repeatedly voted the best
        cinema in the UK&rdquo;. Each edition stretches over ten days and
        screens the work of almost a hundred filmmakers from around the world.
      </p>
      <p>
        The competition is organised around what a film cost to make as much as
        what it is: alongside the documentary, sci-fi/horror, LGBT and female
        director awards sit prizes for the best low-budget, micro-budget and
        no-budget feature, the last of them for films made for under
        &pound;10,000. Shorts, animation, experimental work, music videos and
        screenplays are judged in their own categories. Around the screenings
        run industry events, training programmes led by working professionals,
        and a pitching Mini-Market where filmmakers put projects in front of
        sales agents and producers for feedback.
      </p>
    </section>
  );
}

export const seoDescription =
  "a twice-yearly festival devoted to first- and second-time filmmakers telling amazing stories with limited budgets, running at the Genesis Cinema since 2004";
export const seoHighlights =
  "premieres from almost a hundred international filmmakers, low-budget, micro-budget and no-budget feature competitions, and industry sessions and pitching events";

export default FestivalBlurb;
