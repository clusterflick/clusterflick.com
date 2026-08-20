import Link from "next/link";

function FilmClubBlurb() {
  return (
    <section>
      <p>
        Lucila&apos;s Film Club is a female-directors-only movie night run by
        London fashion designer Lucila Safdie alongside her best friend June, an
        offshoot of Safdie&apos;s label. She started it because she had
        &ldquo;always wanted to have one&rdquo;: &ldquo;I love movies so much
        and since they are such an important part of what I do, I thought it
        would be nice to share with the people who love the brand, the films I
        love and some of the female directors who have inspired me.&rdquo;
      </p>
      <p>
        It began at the{" "}
        <Link href="/venues/genesis-cinema">Genesis Cinema</Link> in east London
        with a run of classics by female directors, and has since taken over
        other venues around the city. Editions are announced through the
        club&apos;s Instagram, and the evenings are as much occasion as
        programme — in Safdie&apos;s words, &ldquo;girls dressing up together,
        putting on their headbands on a Saturday night, and going to the
        cinema&rdquo;.
      </p>
    </section>
  );
}

export const seoDescription =
  "a female-directors-only film club run by designer Lucila Safdie, screening across London";

export default FilmClubBlurb;
