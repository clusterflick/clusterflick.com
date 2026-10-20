import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The French Film Festival London is held each November at{" "}
        <Link href="/venues/cine-lumiere">Ciné Lumière</Link>, the Institut
        français du Royaume-Uni&rsquo;s cinema in South Kensington. It sets out
        to show &ldquo;the breadth of voices and points of view in French
        cinema&rdquo;: fiction and documentary, live action and animation,
        comedies, dramas and genre films, all made with French support, in
        France and around the world.
      </p>
      <p>
        The 2026 edition runs from 18 to 29 November, with more than 40 films
        and almost 100 screenings, followed by a few days of best-of screenings.
        Many are UK premieres of films still looking for distribution, shown
        alongside award winners such as Minotaur. A new partnership with the
        Cinéma du réel festival joins its selection of documentaries and artist
        films, and a strand of restorations brings Sophie Marceau, Sandrine
        Kiberlain and Laetitia Masson to Ciné Lumière to talk about their
        careers.
      </p>
    </section>
  );
}

export const seoDescription =
  "a fortnight of French cinema at Ciné Lumière each November, with more than 40 films and many UK premieres";
export const seoHighlights =
  "UK premieres, documentaries and artist films, and restorations with their stars and directors in person";

export default FestivalBlurb;
