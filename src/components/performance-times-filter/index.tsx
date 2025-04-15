import Checkbox from "rsuite/cjs/Checkbox";
import CheckPicker from "rsuite/cjs/CheckPicker";

export default function PerformanceTimesFilter({
  performanceTimes,
  values,
  onChange,
}: {
  performanceTimes: string[];
  values: Record<string, boolean>;
  onChange: (values: Record<string, boolean>) => void;
}) {
  const data = performanceTimes.map((value) => ({
    value,
    label: `${`0${value}`.slice(-2)}:00`,
  }));

  return (
    <div>
      <CheckPicker
        block
        searchable={false}
        size="lg"
        placeholder="Performance Times"
        data={data}
        value={Object.keys(values)}
        onChange={(displayed: string[]) => {
          const filteredPerformanceTimes = displayed.reduce(
            (filtered, value) => ({ ...filtered, [value]: true }),
            {} as Record<string, boolean>,
          );
          onChange(filteredPerformanceTimes);
        }}
        onClean={() => {
          const filteredPerformanceTimes = performanceTimes.reduce(
            (filtered, value) => ({ ...filtered, [value]: true }),
            {} as Record<string, boolean>,
          );
          // Horrible hack to let us control the change call for "clearing" the
          // input. In this case, we want to reset it back to fully populated.
          setTimeout(() => onChange(filteredPerformanceTimes), 0);
        }}
        renderExtraFooter={() => (
          <div style={{ borderTop: "1px solid #e5e5e5" }}>
            <Checkbox
              indeterminate={
                Object.keys(values).length > 0 &&
                Object.keys(values).length <
                  Object.keys(performanceTimes).length
              }
              checked={
                Object.keys(values).length ===
                Object.keys(performanceTimes).length
              }
              onChange={(value, checked) => {
                if (checked) {
                  onChange(
                    Object.keys(performanceTimes).reduce(
                      (mapping, id) => ({ ...mapping, [id]: true }),
                      {},
                    ),
                  );
                } else {
                  onChange({});
                }
              }}
            >
              Check all
            </Checkbox>
          </div>
        )}
      />
    </div>
  );
}
