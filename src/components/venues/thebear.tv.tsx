import Link from "next/link";

function VenueBlurb() {
  return (
    <section>
      <p>
        The Bear is a Christian church in Deptford, in{" "}
        <Link href="/london-cinemas/lewisham/">Lewisham</Link>, describing
        itself as &quot;a diverse and creative group of people committed to God
        and others&quot;. It traces its roots to the Deptford Ragged School,
        founded in 1844, and speaks of a &quot;175-year legacy of church-led
        community-based mission in Deptford&quot;.
      </p>
      <p>
        That work now takes in a homelessness project, English classes and a
        group for parents and toddlers. Screenings at its Frankham Street hall
        are put on both by the church itself and by local film festival
        organisers.
      </p>
    </section>
  );
}

export const seoDescription = "Deptford church with roots in the Ragged School";
export const seoHighlights = "screenings by the church and local festivals";

export default VenueBlurb;
