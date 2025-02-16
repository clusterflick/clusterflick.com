import type { Genre } from "@/types";
import Checkbox from "rsuite/cjs/Checkbox";
import CheckPicker from "rsuite/cjs/CheckPicker";

export default function GenreFilter({
  genres,
  values,
  onChange,
}: {
  genres: Record<string, Genre>;
  values: Record<string, boolean>;
  onChange: (values: Record<string, boolean>) => void;
}) {
  const data = Object.values(genres)
    .map(({ id, name }) => ({ value: id, label: name }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div>
      <CheckPicker
        block
        searchable
        size="lg"
        placeholder="Genres"
        data={data}
        value={Object.keys(values)}
        onChange={(displayed: string[]) => {
          const filteredGenres = displayed.reduce(
            (filtered, value) => ({ ...filtered, [value]: true }),
            {} as Record<string, boolean>,
          );
          onChange(filteredGenres);
        }}
        onClean={() => {
          const filteredGenres = data.reduce(
            (filtered, { value }) => ({ ...filtered, [value]: true }),
            {} as Record<string, boolean>,
          );
          // Horrible hack to let us control the change call for "clearing" the
          // input. In this case, we want to reset it back to fully populated.
          setTimeout(() => onChange(filteredGenres), 0);
        }}
        renderExtraFooter={() => (
          <div style={{ borderTop: "1px solid #e5e5e5" }}>
            <Checkbox
              indeterminate={
                Object.keys(values).length > 0 &&
                Object.keys(values).length < Object.keys(genres).length
              }
              checked={
                Object.keys(values).length === Object.keys(genres).length
              }
              onChange={(value, checked) => {
                if (checked) {
                  onChange(
                    Object.keys(genres).reduce(
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
