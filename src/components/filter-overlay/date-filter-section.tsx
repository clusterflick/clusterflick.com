"use client";

import { useMemo } from "react";
import { CinemaData } from "@/types";
import { DateOption, DATE_OPTIONS } from "@/state/filter-config-context";
import {
  getLondonMidnightTimestamp,
  getLondonDayOfWeek,
  timestampToLondonDateString,
  dateStringToLondonTimestamp,
  MS_PER_DAY,
} from "@/utils/format-date";
import Chip from "@/components/chip";
import Switch from "@/components/switch";
import ExpandableSection from "@/components/expandable-section";
import styles from "./filter-overlay.module.css";

interface DateFilterSectionProps {
  movies: CinemaData["movies"];
  dateRange: { start: number | null; end: number | null };
  setDateRange: (start: number | null, end: number | null) => void;
  setDateOption: (option: DateOption) => void;
  hideFinished: boolean;
  onToggleHideFinished: () => void;
}

export default function DateFilterSection({
  movies,
  dateRange,
  setDateRange,
  setDateOption,
  hideFinished,
  onToggleHideFinished,
}: DateFilterSectionProps) {
  // Calculate date range from performance data
  const { minDateStr, maxDateStr } = useMemo(() => {
    const todayMidnight = getLondonMidnightTimestamp();

    // Find the latest performance timestamp using fast numeric comparison
    let latestTimestamp = todayMidnight;

    Object.values(movies).forEach((movie) => {
      movie.performances.forEach((perf) => {
        if (perf.time > latestTimestamp) {
          latestTimestamp = perf.time;
        }
      });
    });

    return {
      // Convert to strings only for HTML date input min/max attributes
      minDateStr: timestampToLondonDateString(todayMidnight),
      maxDateStr: timestampToLondonDateString(latestTimestamp),
    };
  }, [movies]);

  // Convert current timestamps to strings for HTML date inputs
  const startDateStr =
    dateRange.start !== null
      ? timestampToLondonDateString(dateRange.start)
      : "";
  const endDateStr =
    dateRange.end !== null ? timestampToLondonDateString(dateRange.end) : "";

  // Handle date input changes - convert string to timestamp
  // Note: HTML min/max attributes handle bounds validation, so we only need
  // to ensure start/end relationship is maintained
  const handleDateStartChange = (value: string) => {
    if (value === "") {
      setDateRange(null, dateRange.end);
      return;
    }

    const newStartTimestamp = dateStringToLondonTimestamp(value);

    // Ensure start doesn't exceed end
    if (dateRange.end !== null && newStartTimestamp > dateRange.end) {
      setDateRange(newStartTimestamp, newStartTimestamp);
    } else {
      setDateRange(newStartTimestamp, dateRange.end);
    }
  };

  const handleDateEndChange = (value: string) => {
    if (value === "") {
      setDateRange(dateRange.start, null);
      return;
    }

    const newEndTimestamp = dateStringToLondonTimestamp(value);

    // Ensure end doesn't go before start
    if (dateRange.start !== null && newEndTimestamp < dateRange.start) {
      setDateRange(newEndTimestamp, newEndTimestamp);
    } else {
      setDateRange(dateRange.start, newEndTimestamp);
    }
  };

  // Determine current date option based on current date range (using timestamps)
  const currentDateOption: DateOption | null = useMemo(() => {
    const { start, end } = dateRange;
    if (start === null || end === null) return null;

    const todayMidnight = getLondonMidnightTimestamp();
    const dayOfWeek = getLondonDayOfWeek();

    // Today
    if (start === todayMidnight && end === todayMidnight) return "today";

    // Tomorrow
    const tomorrowMidnight = todayMidnight + MS_PER_DAY;
    if (start === tomorrowMidnight && end === tomorrowMidnight)
      return "tomorrow";

    // This week: today to Sunday
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const endOfWeekMidnight = todayMidnight + daysUntilSunday * MS_PER_DAY;
    if (start === todayMidnight && end === endOfWeekMidnight)
      return "this-week";

    // Next 7 days
    const next7Midnight = todayMidnight + 7 * MS_PER_DAY;
    if (start === todayMidnight && end === next7Midnight) return "next-7-days";

    // This weekend
    let saturdayOffset: number;
    let sundayOffset: number;
    if (dayOfWeek === 0) {
      saturdayOffset = -1;
      sundayOffset = 0;
    } else if (dayOfWeek === 6) {
      saturdayOffset = 0;
      sundayOffset = 1;
    } else {
      saturdayOffset = 6 - dayOfWeek;
      sundayOffset = 7 - dayOfWeek;
    }
    const saturdayMidnight = todayMidnight + saturdayOffset * MS_PER_DAY;
    const sundayMidnight = todayMidnight + sundayOffset * MS_PER_DAY;
    if (start === saturdayMidnight && end === sundayMidnight)
      return "this-weekend";

    // Any time (~5 years)
    const allTimeEnd = todayMidnight + 5 * 365 * MS_PER_DAY;
    if (start === todayMidnight && end === allTimeEnd) return "all-time";

    return null;
  }, [dateRange]);

  return (
    <section className={styles.section} aria-labelledby="dates-heading">
      <div className={styles.sectionHeader}>
        <h3 id="dates-heading" className={styles.sectionTitle}>
          Dates
        </h3>
        <Switch
          id="hide-finished"
          label="Hide past showings"
          checked={hideFinished}
          onChange={onToggleHideFinished}
        />
      </div>
      <p className={styles.sectionDescription}>When do you want to go?</p>
      <div
        className={styles.chipGroup}
        role="radiogroup"
        aria-label="Date quick filters"
      >
        {DATE_OPTIONS.map(({ value, label }) => (
          <Chip
            key={value}
            type="radio"
            name="date-option"
            label={label}
            value={value}
            checked={currentDateOption === value}
            onChange={(v) => setDateOption(v as DateOption)}
          />
        ))}
      </div>
      <ExpandableSection title="Select Specific Dates">
        <div className={styles.advancedFilters}>
          <div className={styles.advancedFilterGroup}>
            <div className={styles.dateRangeInputs}>
              <div className={styles.dateInputWrapper}>
                <label htmlFor="date-start" className={styles.dateLabel}>
                  From
                </label>
                <input
                  type="date"
                  id="date-start"
                  className={styles.dateInput}
                  min={minDateStr}
                  max={maxDateStr}
                  value={startDateStr}
                  onChange={(e) => handleDateStartChange(e.target.value)}
                />
              </div>
              <span className={styles.dateRangeSeparator}>–</span>
              <div className={styles.dateInputWrapper}>
                <label htmlFor="date-end" className={styles.dateLabel}>
                  To
                </label>
                <input
                  type="date"
                  id="date-end"
                  className={styles.dateInput}
                  min={minDateStr}
                  max={maxDateStr}
                  value={endDateStr}
                  onChange={(e) => handleDateEndChange(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </ExpandableSection>
    </section>
  );
}
