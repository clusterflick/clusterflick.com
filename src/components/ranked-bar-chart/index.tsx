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
  /**
   * `data-*` attributes for the row, so something around the chart can tie a
   * row to what it stands for (a borough on `BoroughMap`). A row marked
   * `data-active` is drawn as if pointed at.
   */
  attributes?: Record<`data-${string}`, string>;
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
  /**
   * Keeps the caption for screen readers only, for a chart whose figure
   * already names it (the borough map's caption covers its ranked list).
   */
  hideCaption?: boolean;
  /**
   * Lets labels wrap on a phone, for labels that are phrases ("Plain request
   * with a browser user agent") and would leave no room for the bars on one
   * line. Off by default: a wrapped row is taller than the rest, which breaks
   * the run of bars, so names stay on one line.
   */
  wrapLabels?: boolean;
  /**
   * Keeps the rows in the order given rather than largest first, for a chart
   * along a scale of its own (films by decade), where the order is the point.
   */
  keepOrder?: boolean;
}

/**
 * Horizontal bars, largest first (or in the order given, with `keepOrder`),
 * with one or more rows emphasised. Rendered
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
  hideCaption = false,
  wrapLabels = false,
  keepOrder = false,
}: RankedBarChartProps) {
  const sorted = keepOrder
    ? items
    : [...items].sort((a, b) => b.value - a.value);
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
      <table className={clsx(styles.table, wrapLabels && styles.wrapLabels)}>
        <caption
          className={
            split || hideCaption ? styles.visuallyHidden : styles.caption
          }
        >
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
                {...item.attributes}
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
