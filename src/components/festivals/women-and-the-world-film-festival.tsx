import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The Women and the World International Film Festival (WWIFF) brings
        fiction features, documentaries, short films and reports by women
        journalists to London, alongside panels and masterclasses. It is run by
        Ukrainian producers through Talented U, a London non-profit.
      </p>
      <p>
        The festival takes place over a week each November. The 2026 edition
        runs from 5 to 12 November, opening with a gala at Ham Yard Hotel, and
        its theme is the role of women in shaping peace, security and defence.
        Screenings include a DocHouse strand at{" "}
        <Link href="/venues/curzon-bloomsbury">Curzon Bloomsbury</Link> and a
        special screening at the{" "}
        <Link href="/venues/rio-cinema">Rio Cinema</Link> in Dalston.
      </p>
    </section>
  );
}

export const seoDescription =
  "a London festival of fiction, documentary and short films by and about women, with a focus on resilience and peacebuilding";
export const seoHighlights =
  "films, panels and masterclasses on women shaping peace, security and defence";

export default FestivalBlurb;
