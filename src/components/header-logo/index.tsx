"use client";

import Image from "next/image";
import clsx from "clsx";
import OutlineHeading from "@/components/outline-heading";
import { useCinemaData } from "@/state/cinema-data-context";
import { useFilterConfig } from "@/state/filter-config-context";
import styles from "./header-logo.module.css";

export default function HeaderLogo() {
  const { isLoading } = useCinemaData();
  const { resetFilters } = useFilterConfig();

  const handleClick = () => {
    resetFilters();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button className={styles.home} onClick={handleClick} type="button">
      <Image
        src="/images/icon.svg"
        alt="Clusterflick"
        width={40}
        height={40}
        className={clsx(styles.logo, isLoading && styles.spinning)}
      />
      <OutlineHeading as="h1">Clusterflick</OutlineHeading>
    </button>
  );
}
