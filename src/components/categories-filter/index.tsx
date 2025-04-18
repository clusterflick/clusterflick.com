import CheckPicker from "rsuite/cjs/CheckPicker";

const categoryLabels: Record<string, string> = {
  movie: "Movie",
  "multiple-movies": "Movie Marathon",
  tv: "TV",
  quiz: "Quiz",
  comedy: "Comedy",
  music: "Music",
  talk: "Talk",
  workshop: "Workshop",
  shorts: "Short Movies",
  event: "Event",
};
export default function CategoriesFilter({
  categories,
  values,
  onChange,
}: {
  categories: string[];
  values: Record<string, boolean>;
  onChange: (values: Record<string, boolean>) => void;
}) {
  const data = categories.map((value) => ({
    value,
    label: categoryLabels[value],
  }));

  return (
    <div>
      <CheckPicker
        block
        searchable={false}
        size="lg"
        placeholder="Category"
        data={data}
        value={Object.keys(values)}
        onChange={(displayed: string[]) => {
          const filteredCategories = displayed.reduce(
            (filtered, value) => ({ ...filtered, [value]: true }),
            {} as Record<string, boolean>,
          );
          onChange(filteredCategories);
        }}
        onClean={() => {
          const filteredCategories = categories.reduce(
            (filtered, value) => ({ ...filtered, [value]: true }),
            {} as Record<string, boolean>,
          );
          // Horrible hack to let us control the change call for "clearing" the
          // input. In this case, we want to reset it back to fully populated.
          setTimeout(() => onChange(filteredCategories), 0);
        }}
      />
    </div>
  );
}
