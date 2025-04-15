import CheckPicker from "rsuite/cjs/CheckPicker";

const ratingLabels: Record<string, string> = {
  0: "Less than 1★",
  1: "1★",
  2: "2★",
  3: "3★",
  4: "4★",
  5: "5★",
  none: "No audience rating",
};

export default function AudienceRatingFilter({
  audienceRating,
  values,
  onChange,
}: {
  audienceRating: string[];
  values: Record<string, boolean>;
  onChange: (values: Record<string, boolean>) => void;
}) {
  const data = audienceRating.map((value) => ({
    value,
    label: ratingLabels[value],
  }));

  return (
    <div>
      <CheckPicker
        block
        searchable={false}
        size="lg"
        placeholder="Audience Rating"
        data={data}
        value={Object.keys(values)}
        onChange={(displayed: string[]) => {
          const filteredAudienceRating = displayed.reduce(
            (filtered, value) => ({ ...filtered, [value]: true }),
            {} as Record<string, boolean>,
          );
          onChange(filteredAudienceRating);
        }}
        onClean={() => {
          const filteredAudienceRating = audienceRating.reduce(
            (filtered, value) => ({ ...filtered, [value]: true }),
            {} as Record<string, boolean>,
          );
          // Horrible hack to let us control the change call for "clearing" the
          // input. In this case, we want to reset it back to fully populated.
          setTimeout(() => onChange(filteredAudienceRating), 0);
        }}
      />
    </div>
  );
}
