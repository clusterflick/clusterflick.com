import { minutesToTimeString } from "@/utils/format-date";
import styles from "./hour-histogram.module.css";

interface HourHistogramProps {
  /** A count for each hour of the day, 0–23 */
  hours: number[];
  /** What is being counted, for the tooltips and table ("releases") */
  unit: string;
  /** Names the chart for screen readers */
  label: string;
}

const AXIS_HOURS = [0, 3, 6, 9, 12, 15, 18, 21];

/**
 * A column per hour of the day, for when something tends to happen. One
 * series, so no legend: the heading beside it names what is counted. Each
 * column's tooltip gives the hour and its count, and the same figures are in
 * a table for screen readers.
 */
export default function HourHistogram({
  hours,
  unit,
  label,
}: HourHistogramProps) {
  const max = Math.max(1, ...hours);
  const range = (hour: number) =>
    `${minutesToTimeString(hour * 60)}–${minutesToTimeString(((hour + 1) % 24) * 60)}`;

  return (
    <figure className={styles.figure}>
      <div className={styles.plot} aria-hidden="true">
        {hours.map((count, hour) => (
          <div
            key={hour}
            className={styles.column}
            title={`${range(hour)}: ${count} ${unit}`}
          >
            {count > 0 && (
              <span
                className={styles.bar}
                style={{ height: `${(count / max) * 100}%` }}
              />
            )}
          </div>
        ))}
      </div>
      <div className={styles.axis} aria-hidden="true">
        {AXIS_HOURS.map((hour) => (
          <span
            key={hour}
            style={{ left: `${(hour / 24) * 100}%` }}
            className={styles.tick}
          >
            {minutesToTimeString(hour * 60)}
          </span>
        ))}
      </div>
      <div className={styles.visuallyHidden}>
        <table>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">Hour</th>
              <th scope="col">{unit}</th>
            </tr>
          </thead>
          <tbody>
            {hours.map((count, hour) => (
              <tr key={hour}>
                <th scope="row">{range(hour)}</th>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
