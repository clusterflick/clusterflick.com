import {
  AccessibilityFeature,
  type Movie,
  type MoviePerformance,
} from "@/types";
import { Fragment } from "react";
import Button from "rsuite/cjs/Button";
import Divider from "rsuite/cjs/Divider";
import Heading from "rsuite/cjs/Heading";
import Tag from "rsuite/cjs/Tag";
import { format, formatRelative } from "date-fns";
import { useCinemaData } from "@/state/cinema-data-context";
import "./index.scss";
import { enGB } from "date-fns/locale";
import showNumber from "@/utils/show-number";

const formatRelativeLocale = {
  lastWeek: "'Last' eeee [P]",
  yesterday: "'Yesterday' [P]",
  today: "'Today' [P]",
  tomorrow: "'Tomorrow' [P]",
  nextWeek: "eeee [P]",
  other: "eeee do MMM [P]",
};

function PerformanceNotes({ notes }: { notes: string }) {
  const notePieces = notes.split("\n");
  if (notePieces.length > 1) {
    return notePieces.map((piece, index) => <div key={index}>{piece}</div>);
  }
  return notes;
}

function getAccessibilityDescriptionFor(feature: AccessibilityFeature) {
  switch (feature) {
    case AccessibilityFeature.AudioDescription: {
      return (
        <>
          <Tag color="green">Audio Description</Tag> Commentary is provided
          through a headset describing visual action that is essential to
          understanding the story as it unfolds.
        </>
      );
    }
    case AccessibilityFeature.BabyFriendly: {
      return (
        <>
          <Tag color="green">Baby Friendly</Tag> A relaxed environment for new
          parents and babies to enjoy cinema without worry.
        </>
      );
    }
    case AccessibilityFeature.HardOfHearing: {
      return (
        <>
          <Tag color="green">Hard of Hearing</Tag> Captioning is is provided and
          includes text description of significant sound effects as well as
          dialogue.
        </>
      );
    }
    case AccessibilityFeature.Relaxed: {
      return (
        <>
          <Tag color="green">Relaxed</Tag> Relaxed Screenings are tailored for a
          neurodiverse audience.
        </>
      );
    }
    case AccessibilityFeature.Subtitled: {
      return (
        <>
          <Tag color="green">Subtitled</Tag>
        </>
      );
    }
    default: {
      return null;
    }
  }
}

function PerformanceAccessibility({
  accessibility,
}: {
  accessibility: MoviePerformance["accessibility"];
}) {
  if (!accessibility) return null;
  const accessibilityFeatures = Object.keys(accessibility)
    .filter((key) => accessibility[key as AccessibilityFeature])
    .map((key) => ({
      key,
      description: getAccessibilityDescriptionFor(key as AccessibilityFeature),
    }))
    .filter(({ description }) => !!description);

  if (accessibilityFeatures.length === 0) return null;

  if (accessibilityFeatures.length === 1) {
    return (
      <div>
        <strong>Accessibility features:</strong>{" "}
        {accessibilityFeatures[0].description}
      </div>
    );
  }

  return (
    <div>
      <strong>Accessibility features:</strong>
      <ul>
        {accessibilityFeatures.map(({ key, description }) => (
          <li key={key}>{description}</li>
        ))}
      </ul>
    </div>
  );
}

export default function PerformanceList({ movie }: { movie?: Movie }) {
  const { data } = useCinemaData();

  if (!movie) {
    return (
      <div>
        No performances. Select more venues or try a different date range.
      </div>
    );
  }

  const dailyGrouping = movie.performances
    .sort((a, b) => a.time - b.time)
    .reduce(
      (grouping, performance) => {
        const day = format(new Date(performance.time), "yyyy-MM-dd");
        grouping[day] = grouping[day] || [];
        grouping[day].push(performance);
        return grouping;
      },
      {} as Record<string, MoviePerformance[]>,
    );

  return (
    <div className="performance-list">
      {Object.values(dailyGrouping).map((performanceGroup) => {
        const date = new Date(performanceGroup[0].time);
        const locale = {
          ...enGB,
          formatRelative: (token: keyof typeof formatRelativeLocale) =>
            formatRelativeLocale[token] || formatRelativeLocale.other,
        };
        const relativeDay = formatRelative(date, new Date(), { locale });
        return (
          <Fragment key={date.getTime()}>
            <Heading level={4}>
              <Divider>
                <time dateTime={format(date, "yyyy-MM-dd")}>{relativeDay}</time>{" "}
                <Tag
                  style={{
                    backgroundColor: "var(--rs-yellow-100)",
                    border: "1px solid var(--rs-yellow-200)",
                  }}
                >
                  {showNumber(performanceGroup.length)}
                </Tag>
              </Divider>
            </Heading>
            <div style={{ columns: "35em 4", gap: "5em" }}>
              {performanceGroup.map((performance) => {
                const isInThePast = Date.now() > performance.time;
                const time = format(new Date(performance.time), "H:mm");
                const showing = movie.showings[performance.showingId];
                const venue = data?.venues[showing.venueId];
                const isExtraDetails = !!(
                  performance.screen ||
                  showing.title ||
                  performance.status?.soldOut ||
                  performance.accessibility ||
                  performance.notes
                );

                if (!isExtraDetails) {
                  return (
                    <div
                      key={`${performance.showingId}-${performance.time}`}
                      className="performance-details"
                      style={{
                        ...(isInThePast
                          ? { textDecoration: "line-through" }
                          : {}),
                        breakInside: "avoid",
                      }}
                    >
                      <a href={showing.url} target="_blank" rel="noopener">
                        {venue?.name}
                      </a>
                      <Button
                        href={performance.bookingUrl}
                        target="_blank"
                        rel="noopener"
                        className="peformance-booking-button"
                        style={
                          isInThePast ? { textDecoration: "line-through" } : {}
                        }
                        disabled={isInThePast}
                      >
                        <time dateTime={date.toISOString()}>{time}</time>
                      </Button>
                    </div>
                  );
                }

                return (
                  <details
                    key={`${performance.showingId}-${performance.time}`}
                    style={{ breakInside: "avoid" }}
                  >
                    <summary
                      className="performance-details"
                      style={
                        isInThePast ? { textDecoration: "line-through" } : {}
                      }
                    >
                      <a href={showing.url} target="_blank" rel="noopener">
                        {venue?.name}
                      </a>
                      <Button
                        href={performance.bookingUrl}
                        target="_blank"
                        rel="noopener"
                        className="peformance-booking-button"
                        style={
                          isInThePast ? { textDecoration: "line-through" } : {}
                        }
                        disabled={isInThePast}
                      >
                        <time dateTime={date.toISOString()}>{time}</time>
                      </Button>
                    </summary>
                    <div className="performance-extra-details">
                      {performance.screen ? (
                        <div>
                          <strong>Screen:</strong> {performance.screen}
                        </div>
                      ) : null}
                      {showing.title ? (
                        <div>
                          <strong>Original listing title:</strong>{" "}
                          <em>{showing.title}</em>
                        </div>
                      ) : null}
                      {performance.status?.soldOut ? (
                        <div>
                          <strong>Status:</strong> This performance is sold out
                        </div>
                      ) : null}
                      <PerformanceAccessibility
                        accessibility={performance.accessibility}
                      />
                      {performance.notes ? (
                        <div>
                          <strong>Venue notes:</strong>{" "}
                          <PerformanceNotes notes={performance.notes} />
                        </div>
                      ) : null}
                    </div>
                  </details>
                );
              })}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
