import Link from "next/link";

function FilmClubBlurb() {
  return (
    <section>
      <p>
        Feminist Fightback is a London collective organising around
        anti-capitalist, intersectional feminism, and its film club has been
        screening films since 2016. The programme runs from campaigning
        documentaries such as Harlan County USA, Cathy Come Home and Rebel Dykes
        to features like Girlhood, Persepolis and 120 Beats Per Minute, some put
        on with other campaigns, and Halloween usually brings a horror film.
      </p>
      <p>
        Screenings are monthly, now at{" "}
        <Link href="/venues/the-peoples-letters-bookshop">
          The People&apos;s Letters Bookshop
        </Link>{" "}
        in Bethnal Green, with drinks and snacks, suggested donations on the
        door, and all genders welcome.
      </p>
    </section>
  );
}

export const seoDescription =
  "monthly screenings from a London feminist collective, from campaigning documentaries to horror, with donations on the door";

export default FilmClubBlurb;
