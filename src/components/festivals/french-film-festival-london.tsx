import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The French Film Festival London is the Institut français du
        Royaume-Uni&apos;s own festival, held each November at{" "}
        <Link href="/venues/cine-lumiere">Ciné Lumière</Link>, its cinema in
        South Kensington. Over a fortnight it screens more than 40 films made
        with French support, in France and around the world — fiction and
        documentary, live action and animation, comedies, dramas and genre
        films.
      </p>
      <p>
        Many are UK premieres of films still looking for distribution, shown
        alongside award winners, documentaries and artist films programmed with
        the Cinéma du réel festival, and restorations whose stars and directors
        come to discuss them. The festival is followed by a few days of best-of
        screenings.
      </p>
    </section>
  );
}

export const seoDescription =
  "A fortnight of French cinema at Ciné Lumière each November, with more than 40 films and many UK premieres";
export const seoHighlights =
  "UK premieres, documentaries, artist films and restorations with their stars";

export default FestivalBlurb;
