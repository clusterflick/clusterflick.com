import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Ealing Picturehouse is part of the Picturehouse cinema group, a chain of
        independent-minded cinemas known for combining quality arthouse and
        mainstream programming with stylish bar and cafe spaces. Located at the
        Filmworks Walk development in{" "}
        <Link href="/london-cinemas/ealing/">Ealing</Link>, West London, the
        venue features multiple screens and a bar area. Picturehouse cinemas
        offer a membership scheme that provides discounts and priority booking
        across the chain.
      </p>
      <p>
        Situated in the borough that gave its name to the famous Ealing Studios,
        the cinema programmes a blend of independent, foreign-language, and
        documentary films alongside selected mainstream releases, special
        screenings, Q&amp;A events, and community-focused programming.
      </p>
    </section>
  );
}

export const seoDescription = "arthouse cinema in the Ealing Filmworks";
export const seoHighlights =
  "indie films, foreign language, documentaries and special screenings";

export default VenueBlurb;
