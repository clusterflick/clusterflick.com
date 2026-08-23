import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Leyton Library is a public library on Leyton High Road in{" "}
        <Link href="/london-cinemas/waltham-forest/">Waltham Forest</Link>, free
        to join whether or not you live in the borough. It runs over several
        floors, with public computers in a section called the Lighthouse and
        space upstairs for events and activities.
      </p>
      <p>
        Its programme takes in rhyme time and story sessions, crafts, computer
        support and community gatherings, along with a Kids&apos; Film Club
        screening films for younger audiences.
      </p>
    </section>
  );
}

export const seoDescription = "public library on Leyton High Road";
export const seoHighlights = "kids' film club and family screenings";

export default VenueBlurb;
