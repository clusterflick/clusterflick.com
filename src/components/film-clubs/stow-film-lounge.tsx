import Link from "next/link";

function FilmClubBlurb() {
  return (
    <section>
      <p>
        Stow Film Lounge is a pop-up cinema in{" "}
        <Link href="/london-cinemas/waltham-forest">Waltham Forest</Link>, run
        by Nick Bertram and Marcus Shepherd, who met as actor-guides at the
        BFI&apos;s Museum of the Moving Image. Over fifteen years they have
        screened some 750 films in more than 40 venues. Their screenings move
        around Walthamstow, to halls, breweries and churches such as{" "}
        <Link href="/venues/walthamstow-trades-hall">
          Walthamstow Trades Hall
        </Link>
        , <Link href="/venues/signature-brewery">Signature Brew</Link> and{" "}
        <Link href="/venues/st-marys-church-walthamstow">
          St Mary&apos;s Church
        </Link>
        .
      </p>
      <p>
        The programme runs from arthouse to blockbusters, cult favourites and
        festive family screenings, and now and then a guest joins them in
        conversation after the film. Screenings come with their own
        reinterpretations of classic film posters. Tickets are usually available
        on the door, CEA cards are accepted for carers, and screenings are
        subtitled where possible.
      </p>
    </section>
  );
}

export const seoDescription =
  "a pop-up cinema roaming Walthamstow's halls, breweries and churches, with guest talks and its own reinterpretations of classic film posters";

export default FilmClubBlurb;
