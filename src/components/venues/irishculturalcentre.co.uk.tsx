import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Irish Cultural Centre is located on Black&apos;s Road in{" "}
        <Link href="/london-cinemas/hammersmith-and-fulham/">Hammersmith</Link>,
        West London. It serves as a hub for Irish arts and culture in the UK,
        hosting a programme of events including film screenings, live music,
        theatre, talks, and exhibitions. Its cinema programme focuses on Irish
        and Irish-themed films, featuring both classic and contemporary works,
        alongside broader programming.
      </p>
    </section>
  );
}

export const seoDescription = "Hammersmith hub for Irish culture";
export const seoHighlights =
  "Irish film, classic and contemporary works and live events";

export default VenueBlurb;
