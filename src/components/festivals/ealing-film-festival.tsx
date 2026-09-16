import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        Ealing Film Festival describes itself as &ldquo;shining a spotlight on
        emerging filmmaking talent&rdquo;, and says its mission is &ldquo;to
        give the next generation of filmmakers a platform and audience, as well
        as a forum to meet like-minded industry professionals&rdquo;. It is a
        short film festival, programming both emerging and established
        filmmakers, and many of its entries come from students &mdash; some of
        them at Ealing&rsquo;s own University of West London and MetFilm School.
      </p>
      <p>
        It was founded in 2020 by Annemarie Flanagan, Alan Granley and Peter
        Gould; the overall festival winning prize has since been renamed in
        Gould&rsquo;s memory. The first edition was held online during the Covid
        pandemic, and since then the festival has taken cinemas in the borough
        &mdash; <Link href="/venues/act-one-cinema">ActOne Cinema</Link> and{" "}
        <Link href="/venues/ealing-picturehouse">Ealing Picturehouse</Link>{" "}
        &mdash; as well as the historic Pitzhanger Manor &amp; Gallery. Entries
        arrive from well beyond west London: the festival reports 458
        submissions from more than 40 countries for its most recent edition.
      </p>
      <p>
        The programme runs over several days each October, with an opening
        Homegrown strand of &ldquo;short films by local filmmakers &hellip;
        stories born and bred in West London&rdquo;, and awards including a
        Homegrown Award and a People&rsquo;s Choice Award voted for by the
        audience. The festival is proud of &ldquo;Ealing&rsquo;s place in the
        history of British cinema, with the world-famous Ealing Studios
        producing dozens of classic movies over the years, including the
        much-loved Ealing Comedies&rdquo;.
      </p>
    </section>
  );
}

export const seoDescription =
  "a short film festival shining a spotlight on emerging filmmaking talent across the London Borough of Ealing";
export const seoHighlights =
  "the Homegrown strand of West London shorts, award presentations and audience-voted People's Choice screenings";

export default FestivalBlurb;
