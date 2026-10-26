import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Cruciform Building stands on Gower Street, opposite UCL&apos;s main
        campus in Bloomsbury, <Link href="/london-cinemas/camden/">Camden</Link>
        . Alfred Waterhouse and his son Paul designed it as University College
        Hospital, completed in 1906, and its cross-shaped plan gives the
        building its name.
      </p>
      <p>
        It served as the hospital for more than 90 years, until the NHS moved to
        Euston Road, and UCL has since renovated it as home to the Wolfson
        Institute for Biomedical Research, teaching space and a library study
        hub. Departments and groups book its lecture theatres for public events,
        screenings among them.
      </p>
    </section>
  );
}

export const seoDescription =
  "UCL's former University College Hospital building";
export const seoHighlights = "public screenings in UCL lecture theatres";

export default VenueBlurb;
