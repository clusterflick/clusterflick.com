import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Alexandra Palace Theatre sits inside the Victorian people&apos;s palace
        on the hill in <Link href="/london-cinemas/haringey/">Haringey</Link>,
        North London. It opened in 1875 as &quot;a place of spectacle and
        delight&quot; where audiences of up to 3,000 were entertained by
        pantomime, opera, drama and ballet, its stage machinery letting
        performers appear, fly and disappear through the boards.
      </p>
      <p>
        Unable to compete with the West End, the theatre went on to serve as a
        cinema, a chapel and a music hall before the BBC turned it into a
        workshop and prop store, after which it was closed to the public for
        some eighty years and left in what the palace calls &quot;a beautiful
        state of arrested decay&quot;. Restoration began in 2016 and brought it
        back into use with that decay deliberately left on show.
      </p>
      <p>
        The restored theatre programmes comedy, live music, classical concerts
        and family shows, and film turns up among them as live-score events —
        screenings played to a full band or orchestra in the room.
      </p>
    </section>
  );
}

export const seoDescription =
  "Restored Victorian theatre inside Alexandra Palace";
export const seoHighlights =
  "live-score film screenings, comedy, concerts and family shows";

export default VenueBlurb;
