import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        Tower Bridge Collective is a food hall and community hub on Horselydown
        Lane in <Link href="/london-cinemas/southwark/">Southwark</Link>, with
        first-floor views of Tower Bridge. Run by the Blend Family team, it
        brings together thirteen independent food traders and bars alongside a
        kids&apos; play area and a workspace, describing itself as &quot;a
        vibrant hub for authentic flavours and a welcoming space for the
        community&quot;.
      </p>
      <p>
        Its community programme runs from mini discos to sip-and-paint sessions,
        and includes a free Kids Movie Club screening family films.
      </p>
    </section>
  );
}

export const seoDescription = "Food hall and community hub beside Tower Bridge";
export const seoHighlights = "free kids film club and community events";

export default VenueBlurb;
