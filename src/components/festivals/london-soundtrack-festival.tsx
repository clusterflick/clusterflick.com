import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The London Soundtrack Festival is the capital&apos;s first festival
        dedicated entirely to the art of film, television, and games music.
        Launched in 2025 at{" "}
        <Link href="/venues/the-barbican">the Barbican</Link>, it sold over
        10,000 tickets in its inaugural year, opening with a gala concert
        featuring composer Howard Shore and the London Philharmonic Orchestra.
        It returns in April 2026 for a three-day run, cementing its place as the
        leading celebration of screen music in the UK.
      </p>
      <p>
        Programming spans live orchestral performances, screenings with live
        scores, panel discussions, and masterclasses with composers, music
        editors, and sound designers working across film and interactive media.
        Whether you&apos;re drawn by iconic scores, experimental soundscapes, or
        the craft behind the music you hear in cinemas and on screens, the
        festival offers a rare opportunity to experience screen music as its own
        art form.
      </p>
    </section>
  );
}

export const seoDescription =
  "London's first festival dedicated to film, TV and games music, held at the Barbican";
export const seoHighlights =
  "live orchestral scores, composer talks and screen music masterclasses";

export default FestivalBlurb;
