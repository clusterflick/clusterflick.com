import CheckPicker from "rsuite/cjs/CheckPicker";

const ratingLabels: Record<string, string> = {
  0: "Less than 1★",
  1: "1★",
  2: "2★",
  3: "3★",
  4: "4★",
  5: "5★",
  6: "6★",
  7: "7★",
  8: "8★",
  9: "9★",
  10: "10★",
  none: "No critics rating",
};

export default function CriticsRatingFilter({
  criticsRating,
  values,
  onChange,
}: {
  criticsRating: string[];
  values: Record<string, boolean>;
  onChange: (values: Record<string, boolean>) => void;
}) {
  const data = criticsRating.map((value) => ({
    value,
    label: ratingLabels[value],
  }));

  return (
    <div>
      <CheckPicker
        block
        searchable={false}
        size="lg"
        placeholder="Critics Rating"
        data={data}
        value={Object.keys(values)}
        onChange={(displayed: string[]) => {
          const filteredCriticsRating = displayed.reduce(
            (filtered, value) => ({ ...filtered, [value]: true }),
            {} as Record<string, boolean>,
          );
          onChange(filteredCriticsRating);
        }}
        onClean={() => {
          const filteredCriticsRating = criticsRating.reduce(
            (filtered, value) => ({ ...filtered, [value]: true }),
            {} as Record<string, boolean>,
          );
          // Horrible hack to let us control the change call for "clearing" the
          // input. In this case, we want to reset it back to fully populated.
          setTimeout(() => onChange(filteredCriticsRating), 0);
        }}
      />
    </div>
  );
}
