import Tag from "@/components/tag";
import type { DataSource } from "@/data/reports/data-sources-2026";
import {
  formatTermsDate,
  getSourceAnchor,
  METHOD_LABELS,
  ROBOTS_COLORS,
  ROBOTS_LABELS,
  TERMS_COLORS,
  TERMS_LABELS,
} from "./labels";
import styles from "./source-table.module.css";

interface SourceTableProps {
  sources: DataSource[];
  caption: string;
}

/**
 * One row per source, each with its own anchor so the row can be linked to.
 * Collapses to a card per source on a narrow screen.
 */
export default function SourceTable({ sources, caption }: SourceTableProps) {
  return (
    <table className={styles.table}>
      <caption className={styles.visuallyHidden}>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Source</th>
          <th scope="col">How we fetch</th>
          <th scope="col">robots.txt</th>
          <th scope="col">Terms</th>
        </tr>
      </thead>
      <tbody>
        {sources.map((source) => (
          <tr
            key={source.id}
            id={getSourceAnchor(source)}
            className={styles.row}
          >
            <th scope="row" className={styles.source}>
              <a href={`#${getSourceAnchor(source)}`} className={styles.name}>
                {source.name}
              </a>
              {source.covers && (
                <span className={styles.covers}>{source.covers}</span>
              )}
            </th>
            <td data-label="How we fetch">
              <span className={styles.method}>
                {METHOD_LABELS[source.method]}
              </span>
              <span className={styles.note}>{source.how}</span>
            </td>
            <td data-label="robots.txt">
              <Tag size="sm" color={ROBOTS_COLORS[source.robots]}>
                {ROBOTS_LABELS[source.robots]}
              </Tag>
              {source.robotsNote && (
                <span className={styles.note}>{source.robotsNote}</span>
              )}
            </td>
            <td data-label="Terms">
              <Tag size="sm" color={TERMS_COLORS[source.terms]}>
                {TERMS_LABELS[source.terms]}
              </Tag>
              {source.termsNote && (
                <span className={styles.note}>{source.termsNote}</span>
              )}
              {(source.termsUrl || source.readInBrowser) && (
                <span className={styles.meta}>
                  {source.termsUrl && (
                    <a
                      href={source.termsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {source.terms === "licence"
                        ? "Read the licence"
                        : "Read the terms"}
                    </a>
                  )}
                  {source.termsDate &&
                    ` · updated ${formatTermsDate(source.termsDate)}`}
                  {source.readInBrowser && " · read in a browser"}
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
