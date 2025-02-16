import { AccessibilityFeature } from "@/types";
import CheckPicker from "rsuite/cjs/CheckPicker";

const accessibilityNames: Record<string, string> = {
  audioDescription: "Audio Description",
  babyFriendly: "Baby Friendly",
  hardOfHearing: "Hard of Hearing",
  relaxed: "Relaxed",
  subtitled: "Subtitled",
  none: "None",
};

export default function AccessibilityFeatureFilter({
  accessibilityFeatures,
  values,
  onChange,
}: {
  accessibilityFeatures: AccessibilityFeature[];
  values: Record<AccessibilityFeature, boolean>;
  onChange: (values: Record<string, boolean>) => void;
}) {
  const data = [...Object.values(AccessibilityFeature), "none"].map(
    (value) => ({
      value,
      label: accessibilityNames[value],
    }),
  );

  return (
    <div>
      <CheckPicker
        block
        searchable={false}
        size="lg"
        placeholder="Accessibility Features"
        data={data}
        value={Object.keys(values)}
        onChange={(displayed: string[]) => {
          const filteredAccessibilityFeature = displayed.reduce(
            (filtered, value) => ({ ...filtered, [value]: true }),
            {} as Record<string, boolean>,
          );
          onChange(filteredAccessibilityFeature);
        }}
        onClean={() => {
          const filteredAccessibilityFeature = accessibilityFeatures.reduce(
            (filtered, value) => ({ ...filtered, [value]: true }),
            {} as Record<string, boolean>,
          );
          // Horrible hack to let us control the change call for "clearing" the
          // input. In this case, we want to reset it back to fully populated.
          setTimeout(() => onChange(filteredAccessibilityFeature), 0);
        }}
      />
    </div>
  );
}
