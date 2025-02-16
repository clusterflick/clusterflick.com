import type { ComponentProps } from "react";
import type { Classification } from "@/types";
import Image from "next/image";
import bbfcU from "./images/BBFC_U_2019.svg";
import bbfcPg from "./images/BBFC_PG_2019.svg";
import bbfc12 from "./images/BBFC_12_2019.svg";
import bbfc12a from "./images/BBFC_12A_2019.svg";
import bbfc15 from "./images/BBFC_15_2019.svg";
import bbfc18 from "./images/BBFC_18_2019.svg";

const mapping: Record<string, ComponentProps<typeof Image>> = {
  u: bbfcU,
  pg: bbfcPg,
  "12": bbfc12,
  "12a": bbfc12a,
  "15": bbfc15,
  "18": bbfc18,
};

interface ClassificationImageProps
  extends Partial<ComponentProps<typeof Image>> {
  classification?: Classification;
}

export default function MovieClassification({
  classification,
  ...props
}: ClassificationImageProps) {
  if (!classification) return null;
  const imageDetails = mapping[classification.toLowerCase().trim()];
  if (imageDetails)
    return (
      <Image
        src={imageDetails.src}
        width={40}
        height={40}
        alt={classification}
        {...props}
      />
    );
  return null;
}
