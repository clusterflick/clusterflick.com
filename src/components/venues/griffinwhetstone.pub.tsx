import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Griffin is a classic pub with modern styling on the High Road in
        Whetstone, <Link href="/london-cinemas/barnet/">Barnet</Link>, calling
        itself &quot;the place to be&hellip; in N20&quot;. Alongside the main
        bar there is a large garden, the covered Lost Garden Bar and Stretch
        Tent, and a private room, the Green Room.
      </p>
      <p>
        The pub&apos;s own calendar runs to the Sunday quiz, drag bingo and
        sport. Film arrives with Lost in Movies, a promoter who takes over the
        big screen here for nights of musicals and crowd favourites.
      </p>
    </section>
  );
}

export const seoDescription =
  "Whetstone pub with a big garden and events space";
export const seoHighlights = "big-screen film nights, quizzes and drag bingo";

export default VenueBlurb;
