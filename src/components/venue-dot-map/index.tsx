import styles from "./venue-dot-map.module.css";

export type VenueDotMapGroup = {
  key: string;
  label: string;
  /** Any CSS colour, custom properties included. */
  color: string;
  /** Drawn smaller and underneath the rest: the backdrop, not the point. */
  muted?: boolean;
};

export type VenueDotMapItem = {
  key: string;
  /** Where the venue falls in the map's viewBox. */
  x: number;
  y: number;
  /** The `key` of its group. */
  group: string;
  /** Shown on hover: the venue's name and type. */
  label: string;
};

interface VenueDotMapProps {
  /** SVG viewBox the outlines and points are drawn in. */
  viewBox: string;
  /** Path data for each area outlined behind the dots (boroughs). */
  outlines: string[];
  groups: VenueDotMapGroup[];
  items: VenueDotMapItem[];
  /** Shown above the map and read out as the summary table's caption. */
  caption: string;
}

/**
 * Venues as dots over an outline of London, coloured by group, with the
 * groups counted in the legend. A static SVG drawn at build time, so it is in
 * the HTML and costs no map library. Screen readers get the counts as a
 * table; the dots themselves are a picture of where.
 */
export default function VenueDotMap({
  viewBox,
  outlines,
  groups,
  items,
  caption,
}: VenueDotMapProps) {
  const counts = new Map(groups.map((group) => [group.key, 0]));
  for (const item of items) {
    counts.set(item.group, (counts.get(item.group) ?? 0) + 1);
  }
  const byKey = new Map(groups.map((group) => [group.key, group]));
  // Muted dots first, so the coloured ones sit on top of them.
  const ordered = [...items].sort(
    (a, b) =>
      Number(!byKey.get(a.group)?.muted) - Number(!byKey.get(b.group)?.muted),
  );

  return (
    <figure className={styles.figure}>
      <p className={styles.caption} aria-hidden="true">
        {caption}
      </p>
      <ul className={styles.legend} aria-hidden="true">
        {groups.map((group) => (
          <li key={group.key}>
            <span
              className={styles.swatch}
              style={{ background: group.color }}
            />
            {group.label} ({counts.get(group.key)})
          </li>
        ))}
      </ul>
      <svg className={styles.map} viewBox={viewBox} aria-hidden="true">
        {outlines.map((d, index) => (
          <path key={index} d={d} className={styles.outline} />
        ))}
        {ordered.map((item) => {
          const group = byKey.get(item.group)!;
          return (
            <circle
              key={item.key}
              cx={item.x}
              cy={item.y}
              r={group.muted ? 3.5 : 5.5}
              style={{ fill: group.color }}
              className={group.muted ? styles.mutedDot : styles.dot}
            >
              <title>{item.label}</title>
            </circle>
          );
        })}
      </svg>
      {/* Hidden by a wrapper: a table ignores the width and overflow that
          hide it, and would widen the page on a phone. */}
      <div className={styles.visuallyHidden}>
        <table>
          <caption>{caption}</caption>
          <thead>
            <tr>
              <th scope="col">Kind of place</th>
              <th scope="col">Places</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.key}>
                <th scope="row">{group.label}</th>
                <td>{counts.get(group.key)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
