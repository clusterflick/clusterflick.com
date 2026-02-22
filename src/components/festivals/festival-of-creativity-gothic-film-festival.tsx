import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The Festival of Creativity: Gothic Film Festival is an annual event at{" "}
        <Link href="/venues/the-1850">
          St Mary&apos;s University, Twickenham
        </Link>
        , bringing together screenings of Gothic and horror cinema with academic
        talks and creative programming. Launched in 2024 as part of the
        university&apos;s broader Festival of Creativity, it attracted over
        1,300 attendees in its second year, establishing itself as a distinctive
        event where scholarly curiosity and cinematic atmosphere meet.
      </p>
      <p>
        Rooted in the university&apos;s arts and humanities departments, the
        festival takes Gothic film seriously as an art form — exploring themes
        of dread, transgression, the supernatural, and the uncanny through
        carefully curated screenings. Programming draws on both classic Gothic
        cinema and contemporary works that carry the tradition forward, making
        it a compelling destination for fans who want to think as well as
        shudder.
      </p>
    </section>
  );
}

export const seoDescription =
  "annual Gothic and horror film festival at St Mary's University, Twickenham";
export const seoHighlights =
  "Gothic cinema, horror screenings and academic talks";

export default FestivalBlurb;
