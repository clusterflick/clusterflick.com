import clsx from "clsx";
import type {
  DataSource,
  RobotsVerdict,
  TermsVerdict,
} from "@/data/reports/data-sources-2026";
import { getSourceAnchor, TERMS_LABELS } from "./labels";
import styles from "./where-we-sit.module.css";

// Rows run from objecting to not applying, columns from no rules to rules
// against us, so the cells where we go against a site's rules are the top
// row and the right-hand column.
const ROWS: { label: string; verdicts: RobotsVerdict[]; clash: boolean }[] = [
  {
    label: "Disallows pages we fetch",
    verdicts: ["disallows", "disallows-intent"],
    clash: true,
  },
  {
    label: "Allows them, or publishes none",
    verdicts: ["allows", "none"],
    clash: false,
  },
  {
    label: "Doesn't apply: official API or dataset",
    verdicts: ["not-applicable"],
    clash: false,
  },
];

const COLUMNS: TermsVerdict[] = [
  "licence",
  "none-found",
  "silent",
  "restricts",
  "borderline",
  "bans",
];

/** Names shown in a cell before the rest are counted. */
const NAMES_SHOWN = 5;

interface WhereWeSitProps {
  sources: DataSource[];
}

/**
 * Every source placed by what its robots.txt (rows) and its terms (columns)
 * say about how we fetch from it. A table, so it reads as one to a screen
 * reader; shaded by how many sources fall in each cell.
 */
export default function WhereWeSit({ sources }: WhereWeSitProps) {
  const cells = ROWS.map((row) =>
    COLUMNS.map((terms) =>
      sources.filter(
        (source) =>
          row.verdicts.includes(source.robots) && source.terms === terms,
      ),
    ),
  );
  const max = Math.max(...cells.flat().map((cell) => cell.length));

  return (
    <figure className={styles.figure}>
      <p className={styles.scrollHint} aria-hidden="true">
        Scroll sideways for the stricter terms →
      </p>
      <div className={styles.scroller}>
        <table className={styles.table}>
          <caption className={styles.visuallyHidden}>
            Sources by what their robots.txt and their terms say about how we
            fetch from them
          </caption>
          <thead>
            <tr>
              <td className={styles.corner}>
                <span className={styles.axisTerms}>Terms →</span>
                <span className={styles.axisRobots}>robots.txt ↓</span>
              </td>
              {COLUMNS.map((terms) => (
                <th key={terms} scope="col" className={styles.columnHeading}>
                  {TERMS_LABELS[terms]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, rowIndex) => (
              <tr key={row.label}>
                <th scope="row" className={styles.rowHeading}>
                  {row.label}
                </th>
                {cells[rowIndex].map((cell, columnIndex) => {
                  const terms = COLUMNS[columnIndex];
                  const clash = row.clash || terms === "bans";
                  // Square root, so a cell of one still shows against the
                  // crowded middle without the middle washing everything out.
                  // Neutral, since pink is kept for the clashes.
                  const shade = cell.length
                    ? 0.04 + 0.14 * Math.sqrt(cell.length / max)
                    : 0;
                  // A clash names every source in it; that is the point.
                  const shown = clash ? cell.length : NAMES_SHOWN;
                  return (
                    <td
                      key={terms}
                      className={clsx(
                        styles.cell,
                        clash && styles.clash,
                        clash && cell.length > 0 && styles.clashFilled,
                      )}
                      style={
                        clash && cell.length > 0
                          ? undefined
                          : {
                              backgroundColor: `rgba(var(--color-white-rgb), ${shade})`,
                            }
                      }
                      title={
                        cell.length
                          ? `${cell.length}: ${cell.map((s) => s.name).join(", ")}`
                          : undefined
                      }
                    >
                      {cell.length > 0 ? (
                        <>
                          <span className={styles.count}>{cell.length}</span>
                          <ul className={styles.names}>
                            {cell.slice(0, shown).map((source) => (
                              <li key={source.id}>
                                <a href={`#${getSourceAnchor(source)}`}>
                                  {source.name}
                                </a>
                              </li>
                            ))}
                            {cell.length > shown && (
                              <li className={styles.more}>
                                and {cell.length - shown} more
                              </li>
                            )}
                          </ul>
                        </>
                      ) : (
                        <span className={styles.empty} aria-label="None">
                          –
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className={styles.legend}>
        <span className={styles.legendSwatch} aria-hidden="true" />
        Outlined in pink: what we do goes against the site&apos;s own published
        rules. Elsewhere, lighter cells hold more sources.
      </figcaption>
    </figure>
  );
}
