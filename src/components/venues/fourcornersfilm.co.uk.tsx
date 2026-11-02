import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Four Corners is a centre for film and photography at 121 Roman Road in
        Bethnal Green, in{" "}
        <Link href="/london-cinemas/tower-hamlets/">Tower Hamlets</Link>. It
        grew from two neighbouring collectives, Four Corners and Camerawork, and
        describes almost 50 years of &quot;radical, socially-engaged approaches
        to photography and film&quot;.
      </p>
      <p>
        Alongside a darkroom, studio and workspace, its training projects help
        underrepresented people gain skills in creative media. The ground-floor
        gallery holds 40 seated or 200 standing, and is, it says, well suited to
        exhibitions of photography and film. Screenings are part of Four
        Corners&apos; own cultural programme, next to its exhibitions and talks.
      </p>
    </section>
  );
}

export const seoDescription = "Bethnal Green centre for film and photography";
export const seoHighlights = "film screenings, exhibitions and training";

export default VenueBlurb;
