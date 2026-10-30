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
  /**
   * Part of `value` drawn as a second segment, named by the chart's
   * `split` legend. Only used when the chart has one.
   */
  splitValue?: number;
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
  /**
   * Splits each bar in two: `split` names each item's `splitValue`, drawn in
   * the accent colour, and `rest` names the remainder. Shows a legend.
   */
  split?: { split: string; rest: string };
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
  split,
}: RankedBarChartProps) {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const max = Math.max(...sorted.map((item) => item.value), 1);

  return (
    <figure className={styles.figure}>
      {split && (
        // The legend sits between the caption and the bars, so the caption
        // is shown here and the table's own is kept for screen readers.
        <p className={styles.caption} aria-hidden="true">
          {caption}
        </p>
      )}
      {split && (
        <ul className={styles.legend} aria-hidden="true">
          <li>
            <span className={clsx(styles.swatch, styles.swatchSplit)} />
            {split.split}
          </li>
          <li>
            <span className={styles.swatch} />
            {split.rest}
          </li>
        </ul>
      )}
      <table className={styles.table}>
        <caption className={split ? styles.visuallyHidden : styles.caption}>
          {caption}
        </caption>
        <thead className={styles.visuallyHidden}>
          <tr>
            <th scope="col">{labelHeading}</th>
            <th scope="col">{valueHeading}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => {
            const splitValue = split ? (item.splitValue ?? 0) : 0;
            const rest = item.value - splitValue;
            return (
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
                      className={styles.stack}
                      style={{ width: `${(item.value / max) * 100}%` }}
                    >
                      {splitValue > 0 && (
                        <span
                          className={clsx(styles.bar, styles.barSplit)}
                          style={{ flexGrow: splitValue }}
                        />
                      )}
                      {rest > 0 && (
                        <span
                          className={styles.bar}
                          style={{ flexGrow: rest }}
                        />
                      )}
                    </span>
                  </span>
                  <span className={styles.value}>
                    {formatValue(item.value)}
                    {split && (
                      <span className={styles.visuallyHidden}>
                        {" "}
                        ({formatValue(splitValue)} {split.split},{" "}
                        {formatValue(rest)} {split.rest})
                      </span>
                    )}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </figure>
  );
}
