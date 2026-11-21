import type { ReactNode } from "react";
import clsx from "clsx";
import {
  ChevronDownIcon,
  CrossIcon,
  TickIcon,
  WarningIcon,
} from "@/components/icons";
import type {
  AccessFact,
  AccessPositionFact,
  AccessScreen,
  AccessStatus,
  VenueAccess as VenueAccessRecord,
} from "@/utils/venue-access-types";
import {
  VENUE_ACCESS_GROUPS,
  VENUE_ACCESS_LABELS,
  describeScreenCount,
  formatAccessDate,
  getAccessSummary,
  getFactLabel,
  getFactNoteNumbers,
  getScreenCountStatus,
  getSourceNotes,
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

/** The footnote numbers for some facts, or none when there's one source. */
type RefsFor = (facts: AccessFact[]) => number[];

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
 * A status as a mark and its word: a green tick for yes, a pink cross for
 * no, as the personalise page marks on and off, and a yellow tick for partly.
 * The word stays beside the mark, so it reads without colour or the icon.
 * Unknown and not applicable get no mark: they aren't an answer either way.
 */
function StatusMark({
  status,
  text,
  large = false,
}: {
  status: AccessStatus;
  text: string;
  large?: boolean;
}) {
  const Icon =
    status === "yes" || status === "partial"
      ? TickIcon
      : status === "no"
        ? CrossIcon
        : null;
  return (
    <span
      className={clsx(
        styles.status,
        styles[status],
        large && styles.statusLarge,
      )}
    >
      {Icon && (
        <Icon
          size={large ? 20 : 16}
          aria-hidden="true"
          className={styles.mark}
        />
      )}
      {text}
    </span>
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
      // Collapsed to its marker: how the sources disagree is detail for a
      // reader who wants it, and spelled out under every such fact it
      // crowded out the facts themselves.
      lines.push(
        <details key={`conflict-${index}`} className={styles.conflict}>
          <summary className={styles.conflictSummary}>
            <WarningIcon size={14} className={styles.conflictMark} />
            Sources disagree
            <ChevronDownIcon size={14} className={styles.conflictChevron} />
          </summary>
          <span className={styles.conflictText}>{fact.conflict}</span>
        </details>,
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

/** A fact as its mark, footnotes and details. */
function Fact({ fact, refsFor }: { fact: AccessFact; refsFor: RefsFor }) {
  return (
    <span className={styles.cell}>
      <StatusMark status={fact.status} text={getFactLabel(fact)} />
      <NoteRefs numbers={refsFor([fact])} />
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
  refsFor,
}: {
  screen: AccessScreen;
  refsFor: RefsFor;
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
  return (
    <span className={styles.cell}>
      <StatusMark
        status={spaces.status}
        text={where ? `${text}, ${where}` : text}
      />
      <NoteRefs numbers={refsFor([spaces, position])} />
      <FactDetails facts={[spaces, position]} />
    </span>
  );
}

function SummaryItem({
  label,
  status,
  text,
  detail,
}: {
  label: string;
  status: AccessStatus;
  text: string;
  detail?: string | null;
}) {
  return (
    <li className={styles.summaryItem}>
      <span className={styles.summaryLabel}>{label}</span>
      <StatusMark status={status} text={text} large />
      {/* Always rendered, empty or not, so each tile keeps the row's three
          tracks and the values line up across tiles. */}
      <span className={styles.summaryDetail}>{detail}</span>
    </li>
  );
}

/**
 * A venue's building and screens. A short summary first, for whether a visit
 * will be easy at a glance, then getting in, facilities and each screen, every
 * fact traceable to the page it came from and the day it was checked.
 *
 * "Not published" is shown rather than hidden: knowing a venue doesn't say is
 * itself worth knowing before a visit.
 */
export default function VenueAccess({ access, venueName }: VenueAccessProps) {
  const { notes, numberOf } = getSourceNotes(access);
  // With one source every fact would carry the same footnote; the sources
  // line says it once instead.
  const refsFor: RefsFor =
    notes.length > 1
      ? (facts) =>
          [
            ...new Set(
              facts.flatMap((fact) => getFactNoteNumbers(fact, numberOf)),
            ),
          ].sort((a, b) => a - b)
      : () => [];
  const summary = getAccessSummary(access);
  const stepFreeScreens = describeScreenCount(summary.stepFreeScreens);
  const screensWithSpaces = describeScreenCount(summary.screensWithSpaces);
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
              <Fact fact={access[field]} refsFor={refsFor} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );

  const [gettingIn, facilities] = VENUE_ACCESS_GROUPS;
  const sourceLine = (note: (typeof notes)[number]) => (
    <>
      <a href={note.url} target="_blank" rel="noopener noreferrer">
        {note.host}
      </a>
      {note.tier === 1 ? ", the venue's own site" : ""}, checked{" "}
      {formatAccessDate(note.checkedOn)}
      {note.sourceLastUpdated &&
        `; the source was last updated ${formatAccessDate(note.sourceLastUpdated)}`}
    </>
  );

  return (
    <div className={styles.access}>
      <ul className={styles.summary} aria-label="At a glance">
        <SummaryItem
          label="Step-free access"
          status={summary.stepFreeAccess.status}
          text={getFactLabel(summary.stepFreeAccess)}
        />
        {summary.stepFreeScreens.total > 0 && (
          <SummaryItem
            label="Step-free screens"
            status={getScreenCountStatus(summary.stepFreeScreens)}
            text={stepFreeScreens.text}
            detail={stepFreeScreens.detail}
          />
        )}
        {summary.screensWithSpaces.total > 0 && (
          <SummaryItem
            label="Screens with wheelchair spaces"
            status={getScreenCountStatus(summary.screensWithSpaces)}
            text={screensWithSpaces.text}
            detail={screensWithSpaces.detail}
          />
        )}
        <SummaryItem
          label="Accessible toilet"
          status={summary.accessibleToilet.status}
          text={getFactLabel(summary.accessibleToilet)}
        />
      </ul>

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
                      <Fact fact={screen.step_free} refsFor={refsFor} />
                    </td>
                    <td data-label="Wheelchair spaces">
                      <WheelchairSpaces screen={screen} refsFor={refsFor} />
                    </td>
                    <td data-label="Transfer seats">
                      <Fact fact={screen.transfer_seating} refsFor={refsFor} />
                    </td>
                    <td data-label="Hearing help">
                      <Fact fact={screen.hearing_assist} refsFor={refsFor} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {access.notes && <p className={styles.recordNotes}>{access.notes}</p>}

      <div className={styles.footer}>
        {notes.length === 1 && <p>From {sourceLine(notes[0])}.</p>}
        {notes.length > 1 && (
          <ol className={styles.sources}>
            {notes.map((note) => (
              <li key={note.url} id={`access-source-${note.number}`}>
                {sourceLine(note)}.
              </li>
            ))}
          </ol>
        )}
        <p>
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
    </div>
  );
}
