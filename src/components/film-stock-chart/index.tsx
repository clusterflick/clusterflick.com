import type { CSSProperties } from "react";
import clsx from "clsx";
import styles from "./film-stock-chart.module.css";

export type FilmStockChartItem = {
  key: string;
  label: string;
  /** The stock's width in millimetres, which sets the bar's thickness. */
  gauge: number;
  /** Film has perforations along both edges; tape has none. */
  stock: "film" | "tape";
  value: number;
  /** Part of `value` drawn as the second segment, named by `split`. */
  splitValue?: number;
};

interface FilmStockChartProps {
  items: FilmStockChartItem[];
  /** Shown above the chart and read out as the table's caption. */
  caption: string;
  labelHeading: string;
  valueHeading: string;
  /**
   * Splits each bar in two: `split` names each item's `splitValue`, drawn in
   * the accent colour, and `rest` names the remainder. Shows a legend.
   */
  split?: { split: string; rest: string };
}

/** Pixels per millimetre of gauge: 35mm draws about 19px thick. */
const PX_PER_MM = 0.55;

/**
 * Formats drawn as the stock they stand for: each bar is as thick as its
 * gauge, to scale, and filled along its length by its screenings. The whole
 * width is drawn as unexposed stock, so even a short bar reads as film or
 * tape. Rendered as a table, so the numbers are there for screen readers.
 */
export default function FilmStockChart({
  items,
  caption,
  labelHeading,
  valueHeading,
  split,
}: FilmStockChartProps) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <figure className={styles.figure}>
      <p className={styles.caption} aria-hidden="true">
        {caption}
      </p>
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
        <caption className={styles.visuallyHidden}>{caption}</caption>
        <thead className={styles.visuallyHidden}>
          <tr>
            <th scope="col">{labelHeading}</th>
            <th scope="col">{valueHeading}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const splitValue = split ? (item.splitValue ?? 0) : 0;
            const rest = item.value - splitValue;
            return (
              <tr key={item.key} className={styles.row}>
                <th scope="row" className={styles.label}>
                  {item.label}
                </th>
                <td className={styles.cell}>
                  <span
                    className={clsx(
                      styles.stock,
                      item.stock === "tape" ? styles.tape : styles.film,
                    )}
                    style={
                      {
                        "--thickness": `${Math.max(item.gauge * PX_PER_MM, 6)}px`,
                      } as CSSProperties
                    }
                    aria-hidden="true"
                  >
                    <span
                      className={styles.exposed}
                      style={{ width: `${(item.value / max) * 100}%` }}
                    >
                      {splitValue > 0 && (
                        <span
                          className={styles.segmentSplit}
                          style={{ flexGrow: splitValue }}
                        />
                      )}
                      {rest > 0 && (
                        <span
                          className={styles.segment}
                          style={{ flexGrow: rest }}
                        />
                      )}
                    </span>
                  </span>
                  <span className={styles.value}>
                    {item.value.toLocaleString("en-GB")}
                    {split && (
                      <span className={styles.visuallyHidden}>
                        {" "}
                        ({splitValue.toLocaleString("en-GB")} {split.split},{" "}
                        {rest.toLocaleString("en-GB")} {split.rest})
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
