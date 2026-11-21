import type { ReactNode } from "react";
import clsx from "clsx";
import type {
  AccessFact,
  AccessPositionFact,
  AccessScreen,
  VenueAccess as VenueAccessRecord,
} from "@/utils/get-venue-accessibility";
import {
  VENUE_ACCESS_GROUPS,
  VENUE_ACCESS_LABELS,
  formatAccessDate,
  getFactNoteNumbers,
  getSourceNotes,
  getFactLabel,
} from "@/utils/describe-venue-access";
import styles from "./venue-access.module.css";

interface VenueAccessProps {
  access: VenueAccessRecord;
  venueName: string;
}

const POSITION_LABELS: Record<AccessPositionFact["value"], string | null> = {
  front: "at the front",
  middle: "in the middle",
  rear: "at the back",
  mixed: "in more than one place",
  unknown: null,
};

const CORRECTION_ADDRESS = "hello@clusterflick.com";

function NoteRefs({ numbers }: { numbers: number[] }) {
  if (numbers.length === 0) return null;
  return (
    <sup className={styles.refs}>
      {numbers.map((number, index) => (
        <span key={number}>
          {index > 0 && ","}
          <a href={`#access-source-${number}`} aria-label={`Source ${number}`}>
            {number}
          </a>
        </span>
      ))}
    </sup>
  );
}

/**
 * What a fact adds beneath its status: its note, how its sources disagree, and
 * for a field we don't know, the last report found elsewhere.
 */
function FactDetails({ facts }: { facts: AccessFact[] }) {
  const lines: ReactNode[] = [];
  facts.forEach((fact, index) => {
    if (fact.note) lines.push(<span key={`note-${index}`}>{fact.note}</span>);
    if (fact.sources.some((source) => source.chain_wide)) {
      lines.push(
        <span key={`chain-${index}`}>
          A policy for every venue in the chain
        </span>,
      );
    }
    if (fact.conflict) {
      lines.push(
        <span key={`conflict-${index}`} className={styles.conflict}>
          <strong>Sources disagree:</strong> {fact.conflict}
        </span>,
      );
    }
    if (fact.status === "unknown" && fact.last_found) {
      const { claim, url, found_on } = fact.last_found;
      lines.push(
        <span key={`last-${index}`}>
          The last report we found said &ldquo;{claim}&rdquo; (
          <a href={url} target="_blank" rel="noopener noreferrer">
            {new URL(url).hostname.replace(/^www\./, "")}
          </a>
          , {formatAccessDate(found_on)})
        </span>,
      );
    }
  });
  if (lines.length === 0) return null;
  return <span className={styles.details}>{lines}</span>;
}

function Status({ text, unknown }: { text: string; unknown: boolean }) {
  return (
    <span className={clsx(styles.status, unknown && styles.unknown)}>
      {text}
    </span>
  );
}

/** A fact as its status, footnotes and details. */
function Fact({
  fact,
  numberOf,
}: {
  fact: AccessFact;
  numberOf: (url: string) => number;
}) {
  return (
    <span className={styles.cell}>
      <Status text={getFactLabel(fact)} unknown={fact.status === "unknown"} />
      <NoteRefs numbers={getFactNoteNumbers(fact, numberOf)} />
      <FactDetails facts={[fact]} />
    </span>
  );
}

/**
 * The wheelchair spaces cell: the count where the source gives one, with
 * where they are. A count a page contradicts itself on is left out, so the
 * cell says there are spaces and that the sources disagree on how many.
 */
function WheelchairSpaces({
  screen,
  numberOf,
}: {
  screen: AccessScreen;
  numberOf: (url: string) => number;
}) {
  const spaces = screen.wheelchair_spaces;
  const position = screen.space_position;
  let text = getFactLabel(spaces);
  if (spaces.status === "yes" && spaces.count !== null) {
    text = `${spaces.count}`;
  } else if (spaces.status === "no") {
    text = "None";
  }
  const where =
    position.status !== "unknown" ? POSITION_LABELS[position.value] : null;
  const numbers = [
    ...new Set([
      ...getFactNoteNumbers(spaces, numberOf),
      ...getFactNoteNumbers(position, numberOf),
    ]),
  ].sort((a, b) => a - b);
  return (
    <span className={styles.cell}>
      <Status
        text={where ? `${text}, ${where}` : text}
        unknown={spaces.status === "unknown"}
      />
      <NoteRefs numbers={numbers} />
      <FactDetails facts={[spaces, position]} />
    </span>
  );
}

/**
 * A venue's building and screens: getting in, each screen, and its
 * facilities, every fact footnoted to the page it came from and the day it
 * was checked.
 *
 * "Not published" is shown rather than hidden: knowing a venue doesn't say is
 * itself worth knowing before a visit.
 */
export default function VenueAccess({ access, venueName }: VenueAccessProps) {
  const { notes, numberOf } = getSourceNotes(access);
  const correctionHref = `mailto:${CORRECTION_ADDRESS}?subject=${encodeURIComponent(
    `Access information for ${venueName}`,
  )}`;

  const group = ({ title, fields }: (typeof VENUE_ACCESS_GROUPS)[number]) => (
    <div className={styles.group} key={title}>
      <h3 className={styles.heading}>{title}</h3>
      <dl className={styles.facts}>
        {fields.map((field) => (
          <div className={styles.fact} key={field}>
            <dt className={styles.label}>{VENUE_ACCESS_LABELS[field]}</dt>
            <dd className={styles.value}>
              <Fact fact={access[field]} numberOf={numberOf} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );

  const [gettingIn, facilities] = VENUE_ACCESS_GROUPS;

  return (
    <div className={styles.access}>
      <div className={styles.groups}>
        {group(gettingIn)}
        {group(facilities)}
      </div>

      {access.screens.length > 0 && (
        <div className={styles.group}>
          <h3 className={styles.heading}>Screens</h3>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Screen</th>
                  <th scope="col">Step-free</th>
                  <th scope="col">Wheelchair spaces</th>
                  <th scope="col">Transfer seats</th>
                  <th scope="col">Hearing help</th>
                </tr>
              </thead>
              <tbody>
                {access.screens.map((screen) => (
                  <tr key={screen.name}>
                    <th scope="row">
                      {screen.name}
                      {screen.notes && (
                        <span className={styles.details}>{screen.notes}</span>
                      )}
                    </th>
                    <td data-label="Step-free">
                      <Fact fact={screen.step_free} numberOf={numberOf} />
                    </td>
                    <td data-label="Wheelchair spaces">
                      <WheelchairSpaces screen={screen} numberOf={numberOf} />
                    </td>
                    <td data-label="Transfer seats">
                      <Fact
                        fact={screen.transfer_seating}
                        numberOf={numberOf}
                      />
                    </td>
                    <td data-label="Hearing help">
                      <Fact fact={screen.hearing_assist} numberOf={numberOf} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {access.notes && <p className={styles.recordNotes}>{access.notes}</p>}

      {notes.length > 0 && (
        <div className={styles.group}>
          <h3 className={styles.heading}>Sources</h3>
          <ol className={styles.sources}>
            {notes.map((note) => (
              <li key={note.url} id={`access-source-${note.number}`}>
                <a href={note.url} target="_blank" rel="noopener noreferrer">
                  {note.host}
                </a>
                {note.tier === 1 ? ", the venue's own site" : ""}. Checked{" "}
                {formatAccessDate(note.checkedOn)}
                {note.sourceLastUpdated &&
                  `; the source was last updated ${formatAccessDate(note.sourceLastUpdated)}`}
                .
              </li>
            ))}
          </ol>
        </div>
      )}

      <p className={styles.footer}>
        {access.access_page_url && (
          <>
            <a
              href={access.access_page_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {venueName}&rsquo;s own access information
            </a>
            .{" "}
          </>
        )}
        {access.access_contact && <>Contact: {access.access_contact}. </>}
        Something wrong or out of date? <a href={correctionHref}>Tell us</a>.
      </p>
    </div>
  );
}
