import type { Movie } from "@/types";
import Checkbox from "rsuite/cjs/Checkbox";
import CheckPicker from "rsuite/cjs/CheckPicker";

export default function MovieFilter({
  movies,
  values,
  onChange,
}: {
  movies: Record<string, Movie>;
  values: Record<string, boolean>;
  onChange: (values: Record<string, boolean>) => void;
}) {
  const data = Object.values(movies)
    .map(({ id, title }) => ({ value: id, label: title }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div>
      <CheckPicker
        block
        searchable
        size="lg"
        placeholder="Movies"
        data={data}
        value={Object.keys(values)}
        onChange={(displayed: string[]) => {
          const filteredMovies = displayed.reduce(
            (filtered, value) => ({ ...filtered, [value]: true }),
            {} as Record<string, boolean>,
          );
          onChange(filteredMovies);
        }}
        onClean={() => {
          const filteredMovies = data.reduce(
            (filtered, { value }) => ({ ...filtered, [value]: true }),
            {} as Record<string, boolean>,
          );
          // Horrible hack to let us control the change call for "clearing" the
          // input. In this case, we want to reset it back to fully populated.
          setTimeout(() => onChange(filteredMovies), 0);
        }}
        renderExtraFooter={() => (
          <div style={{ borderTop: "1px solid #e5e5e5" }}>
            <Checkbox
              indeterminate={
                Object.keys(values).length > 0 &&
                Object.keys(values).length < Object.keys(movies).length
              }
              checked={
                Object.keys(values).length === Object.keys(movies).length
              }
              onChange={(value, checked) => {
                if (checked) {
                  onChange(
                    Object.keys(movies).reduce(
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
