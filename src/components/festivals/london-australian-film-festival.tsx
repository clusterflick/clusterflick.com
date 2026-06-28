import Link from "next/link";

function FestivalBlurb() {
  return (
    <section>
      <p>
        The London Australian Film Festival, run by the London Australian Film
        Society, brings a weekend of the best new Australian cinema to London
        audiences each summer. It champions bold, independent storytelling from
        Australia — from feature debuts and documentaries to a dedicated short
        film showcase — including powerful First Nations voices and films rarely
        seen on UK screens.
      </p>
      <p>
        The 2026 edition runs across a long weekend at{" "}
        <Link href="/venues/finsbury-park-picturehouse">
          Finsbury Park Picturehouse
        </Link>
        , pairing premieres and festival favourites with a curated short film
        programme.
      </p>
    </section>
  );
}

export const seoDescription =
  "A weekend celebration of new Australian cinema in London, championing independent features, documentaries and First Nations storytelling";
export const seoHighlights =
  "UK premieres, a short film showcase and First Nations stories at Finsbury Park Picturehouse";

export default FestivalBlurb;
