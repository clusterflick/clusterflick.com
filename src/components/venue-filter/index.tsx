import type { Venue } from "@/types";
import Checkbox from "rsuite/cjs/Checkbox";
import CheckPicker from "rsuite/cjs/CheckPicker";

export default function VenueFilter({
  venues,
  values,
  onChange,
}: {
  venues: Record<string, Venue>;
  values: Record<string, boolean>;
  onChange: (values: Record<string, boolean>) => void;
}) {
  const data = Object.values(venues)
    .map(({ id, name }) => ({ value: id, label: name.replace(/^the\s+/i, "") }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div>
      <CheckPicker
        block
        searchable
        size="lg"
        placeholder="Venues"
        data={data}
        value={Object.keys(values)}
        onChange={(displayed: string[]) => {
          const filteredVenues = displayed.reduce(
            (filtered, value) => ({ ...filtered, [value]: true }),
            {} as Record<string, boolean>,
          );
          onChange(filteredVenues);
        }}
        onClean={() => {
          const filteredVenues = data.reduce(
            (filtered, { value }) => ({ ...filtered, [value]: true }),
            {} as Record<string, boolean>,
          );
          // Horrible hack to let us control the change call for "clearing" the
          // input. In this case, we want to reset it back to fully populated.
          setTimeout(() => onChange(filteredVenues), 0);
        }}
        renderExtraFooter={() => (
          <div style={{ borderTop: "1px solid #e5e5e5" }}>
            <Checkbox
              indeterminate={
                Object.keys(values).length > 0 &&
                Object.keys(values).length < Object.keys(venues).length
              }
              checked={
                Object.keys(values).length === Object.keys(venues).length
              }
              onChange={(value, checked) => {
                if (checked) {
                  onChange(
                    Object.keys(venues).reduce(
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
