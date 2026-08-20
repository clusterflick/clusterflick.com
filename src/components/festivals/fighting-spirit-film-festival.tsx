import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The Fighting Spirit Film Festival is one of the only festivals in the
        world given over to martial arts and action cinema. It began in July
        2016 and runs in London — at the{" "}
        <Link href="/venues/rio-cinema">Rio Cinema</Link> in Dalston — and in
        Birmingham. Through martial arts cinema, the organisers say, they
        &ldquo;aim to entertain and inspire people, promote martial arts
        culture, and recognise, connect, and support those who have chosen it as
        a career&rdquo;.
      </p>
      <p>
        Features and shorts screen in and out of competition, from UK premieres
        of new action films to restored classics of the genre, and the weekend
        makes room for the craft behind them too: Q&amp;As with filmmakers and
        stunt performers, seminars on action filmmaking, demonstrations from
        martial arts clubs, and an awards ceremony to finish.
      </p>
    </section>
  );
}

export const seoDescription =
  "one of the world's few festivals devoted to martial arts and action cinema, screening in London and Birmingham since 2016";
export const seoHighlights =
  "UK premieres and genre classics with filmmaker Q&As, action-filmmaking seminars, martial arts demonstrations and an awards ceremony";

export default FestivalBlurb;
