import type { Movie } from "@/types";
import { intervalToDuration, formatDuration } from "date-fns";

const showTimeToNextPerformance = (performances: Movie["performances"]) => {
  const sortedPerformances = performances.sort((a, b) => a.time - b.time);
  const nextPerformance = sortedPerformances.find(
    ({ time }) => time - Date.now() > 0,
  );
  if (!nextPerformance) return "All performances have finished";

  const durationUntil = intervalToDuration({
    start: new Date(),
    end: new Date(nextPerformance.time),
  });

  const largeTimeToNextPerformance = formatDuration(durationUntil, {
    format: ["months", "weeks", "days"],
  });
  if (largeTimeToNextPerformance)
    return `The next one is in ${largeTimeToNextPerformance}`;

  const shortTimeToNextPerformance = formatDuration(durationUntil, {
    format: ["hours"],
  });
  if (shortTimeToNextPerformance)
    return `The next one is in ${shortTimeToNextPerformance}`;

  const imminentTimeToNextPerformance = formatDuration(durationUntil, {
    format: ["minutes"],
  });
  if (imminentTimeToNextPerformance)
    return `The next one is in ${imminentTimeToNextPerformance}`;

  return "The next one is now!";
};

export default showTimeToNextPerformance;
