import Link from "next/link";
import clsx from "clsx";
import styles from "./ranked-bar-chart.module.css";

export type RankedBarChartItem = {
  key: string;
  label: string;
  value: number;
  href?: string;
  /** The row the chart is about: drawn in the accent colour and bold. */
  highlight?: boolean;
};

interface RankedBarChartProps {
  items: RankedBarChartItem[];
  /** Read out as the table's caption, and shown above it. */
  caption: string;
  /** Header for the label column, e.g. "Borough". */
  labelHeading: string;
  /** Header for the value column, e.g. "Screenings". */
  valueHeading: string;
  /** How a value is written, e.g. as a percentage. Defaults to "1,234". */
  formatValue?: (value: number) => string;
}

/**
 * Horizontal bars, largest first, with one or more rows emphasised. Rendered
 * as a table so the numbers are there for screen readers and as the table
 * view. Bars are scaled to the largest value; a value too small to see still
 * gets a sliver, so a row is never mistaken for zero.
 */
export default function RankedBarChart({
  items,
  caption,
  labelHeading,
  valueHeading,
  formatValue = (value) => value.toLocaleString("en-GB"),
}: RankedBarChartProps) {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const max = Math.max(...sorted.map((item) => item.value), 1);

  return (
    <figure className={styles.figure}>
      <table className={styles.table}>
        <caption className={styles.caption}>{caption}</caption>
        <thead className={styles.visuallyHidden}>
          <tr>
            <th scope="col">{labelHeading}</th>
            <th scope="col">{valueHeading}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => (
            <tr
              key={item.key}
              className={clsx(styles.row, item.highlight && styles.highlight)}
            >
              <th scope="row" className={styles.label}>
                {item.href ? (
                  <Link href={item.href}>{item.label}</Link>
                ) : (
                  item.label
                )}
              </th>
              <td className={styles.cell}>
                <span className={styles.track} aria-hidden="true">
                  <span
                    className={styles.bar}
                    style={{ width: `${(item.value / max) * 100}%` }}
                  />
                </span>
                <span className={styles.value}>{formatValue(item.value)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
