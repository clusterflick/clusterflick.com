import type { DateRange } from "@/types";
import { useMemo } from "react";
import { startOfDay, endOfDay, addDays, format } from "date-fns";
import DateRangePicker from "rsuite/cjs/DateRangePicker";
import Tag from "rsuite/cjs/Tag";
import { useCinemaData } from "@/state/cinema-data-context";
import "./index.scss";

export default function DateRange({
  value,
  defaultValue,
  onChange,
}: {
  value: DateRange;
  defaultValue?: DateRange;
  onChange: (value: DateRange) => void;
}) {
  const { data } = useCinemaData();
  const datesWithPerformances = useMemo(
    () =>
      Object.values(data!.movies)
        .flatMap(({ performances }) => performances)
        .reduce(
          (mapping, { time }) => {
            const key = format(new Date(time), "yyyy-MM-dd");
            mapping[key] = mapping[key] ? mapping[key] + 1 : 1;
            return mapping;
          },
          {} as Record<string, number>,
        ),
    [data],
  );
  return (
    <DateRangePicker
      block
      format="dd/MM/yyyy"
      size="lg"
      ranges={[
        {
          label: "Today",
          value: [startOfDay(new Date()), endOfDay(new Date())],
        },
        {
          label: "Tomorrow",
          value: [
            startOfDay(addDays(new Date(), 1)),
            endOfDay(addDays(new Date(), 1)),
          ],
        },
        {
          label: "Next 7 Days",
          value: [startOfDay(new Date()), endOfDay(addDays(new Date(), 6))],
        },
      ]}
      shouldDisableDate={DateRangePicker.beforeToday()}
      value={[new Date(value.start), new Date(value.end)]}
      onChange={(value) => {
        if (!value) return;
        const [start, end] = value;
        onChange({
          start: startOfDay(start).getTime(),
          end: endOfDay(end).getTime(),
        });
      }}
      onClean={() => {
        if (defaultValue) onChange(defaultValue);
      }}
      renderCell={(date) => {
        const key = format(date, "yyyy-MM-dd");
        const hasPerformances = !!datesWithPerformances[key];
        if (!hasPerformances) return date.getDate();
        return (
          <Tag size="sm" className="date-with-performances">
            {date.getDate()}
          </Tag>
        );
      }}
      isoWeek={true}
    />
  );
}
