"use client";

import Image from "next/image";
import OutlineHeading from "@/components/outline-heading";
import { useCinemaData } from "@/state/cinema-data-context";
import { useFilterConfig } from "@/state/filter-config-context";
import { getCinemaVenueIds } from "@/utils/get-cinema-venue-ids";
import styles from "./header-logo.module.css";

export default function HeaderLogo() {
  const { isLoading, metaData } = useCinemaData();
  const { resetFilters, selectVenues } = useFilterConfig();

  const handleClick = () => {
    resetFilters();
    // Re-apply cinema venue default after reset
    if (metaData?.venues) {
      const cinemaIds = getCinemaVenueIds(metaData.venues);
      if (cinemaIds.length > 0) {
        selectVenues(cinemaIds);
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button className={styles.home} onClick={handleClick} type="button">
      <Image
        src="/images/icon.svg"
        alt="Clusterflick"
        width={40}
        height={40}
        className={`${styles.logo} ${isLoading ? styles.spinning : ""}`}
      />
      <OutlineHeading as="h1">Clusterflick</OutlineHeading>
    </button>
  );
}
