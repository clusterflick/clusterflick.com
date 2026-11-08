import Link from "next/link";
import clsx from "clsx";
import styles from "./decade-fingerprint.module.css";

export type DecadeFingerprintItem = {
  key: string;
  label: string;
  href?: string;
  /** The row the chart is about, in bold. */
  highlight?: boolean;
  /** A row there for contrast rather than as one of the set, in grey. */
  muted?: boolean;
  /** Screenings by the decade of their film, keyed by its first year: "1970". */
  decades: Record<string, number>;
  /** What the row ends on, e.g. "86% 25+ years old". */
  detail: string;
};

interface DecadeFingerprintProps {
  items: DecadeFingerprintItem[];
  /** Shown above the strips and read out as the table's caption. */
  caption: string;
  /** Header for the label column, e.g. "Venue". */
  labelHeading: string;
  /** Header for the detail column, e.g. "Films 25+ years old". */
  detailHeading: string;
}

// Oldest to newest: buttery yellow, neon pink, purple, electric blue. Ordered
// hues rather than one fading, so neighbouring decades stay tell-apart-able.
const STOPS = [
  [250, 222, 5],
  [241, 40, 105],
  [100, 50, 150],
  [49, 158, 219],
];

/** The colour for a decade, placed between the oldest and newest shown. */
export function getDecadeColor(decade: number, first: number, last: number) {
  const t = last === first ? 1 : (decade - first) / (last - first);
  const scaled = t * (STOPS.length - 1);
  const index = Math.min(Math.floor(scaled), STOPS.length - 2);
  const fraction = scaled - index;
  const [from, to] = [STOPS[index], STOPS[index + 1]];
  const rgb = from.map((c, i) => Math.round(c + (to[i] - c) * fraction));
  return `rgb(${rgb.join(", ")})`;
}

const percent = (n: number, total: number) =>
  `${Math.round((n / total) * 100)}%`;

/**
 * Each row's screenings laid end to end and coloured by the decade of their
 * film, so a programme's age reads as a pattern: a repertory cinema is a
 * spread of colour, a multiplex one block of this decade. Rendered as a table
 * whose rows read out the decades with their shares.
 */
export default function DecadeFingerprint({
  items,
  caption,
  labelHeading,
  detailHeading,
}: DecadeFingerprintProps) {
  const decades = [
    ...new Set(items.flatMap((item) => Object.keys(item.decades))),
  ]
    .map(Number)
    .sort((a, b) => a - b);
  const first = decades[0];
  const last = decades[decades.length - 1];
  const color = (decade: number) => getDecadeColor(decade, first, last);

  return (
    <figure className={styles.figure}>
      <p className={styles.caption} aria-hidden="true">
        {caption}
      </p>
      <table className={styles.table}>
        <caption className={styles.visuallyHidden}>{caption}</caption>
        <thead className={styles.visuallyHidden}>
          <tr>
            <th scope="col">{labelHeading}</th>
            <th scope="col">Screenings by decade of film</th>
            <th scope="col">{detailHeading}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const total = Object.values(item.decades).reduce(
              (sum, n) => sum + n,
              0,
            );
            const shares = decades.filter((d) => item.decades[d]);
            return (
              <tr
                key={item.key}
                className={clsx(
                  styles.row,
                  item.highlight && styles.highlight,
                  item.muted && styles.muted,
                )}
              >
                <th scope="row" className={styles.label}>
                  {item.href ? (
                    <Link href={item.href}>{item.label}</Link>
                  ) : (
                    item.label
                  )}
                </th>
                <td className={styles.cell}>
                  <span className={styles.strip} aria-hidden="true">
                    {shares.map((decade) => (
                      <span
                        key={decade}
                        className={styles.segment}
                        style={{
                          flexGrow: item.decades[decade],
                          background: color(decade),
                        }}
                        title={`${decade}s: ${percent(item.decades[decade], total)}`}
                      />
                    ))}
                  </span>
                  <span className={styles.visuallyHidden}>
                    {shares
                      .map(
                        (decade) =>
                          `${decade}s ${percent(item.decades[decade], total)}`,
                      )
                      .join(", ")}
                  </span>
                </td>
                <td className={styles.detail}>{item.detail}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <ul className={styles.legend} aria-hidden="true">
        {decades.map((decade) => (
          <li key={decade}>
            <span
              className={styles.swatch}
              style={{ background: color(decade) }}
            />
            {decade}s
          </li>
        ))}
      </ul>
    </figure>
  );
}
