"use client";

import dynamic from "next/dynamic";
import HeaderLogo from "@/components/header-logo";
import HeaderNav from "@/components/header-nav";
import MobileMenu from "@/components/mobile-menu";
import styles from "./main-header.module.css";

const FilterTrigger = dynamic(() => import("@/components/filter-trigger"), {
  ssr: false,
});

export default function MainHeader({
  isFilterOverlayOpen,
  onFilterClick,
  onFilterTextHeightChange,
  showFilters = true,
}: {
  isFilterOverlayOpen?: boolean;
  onFilterClick?: () => void;
  onFilterTextHeightChange?: (height: number) => void;
  /**
   * Whether to render the filter trigger. The discovery home page reuses this
   * header for branding + navigation only, so passes `false`.
   */
  showFilters?: boolean;
}) {
  return (
    <header className={styles.header}>
      <HeaderLogo />
      {showFilters && onFilterClick && (
        <div className={styles.filter}>
          <FilterTrigger
            onClick={onFilterClick}
            isOverlayOpen={isFilterOverlayOpen ?? false}
            onTextHeightChange={onFilterTextHeightChange}
          />
        </div>
      )}
      <HeaderNav />
      <MobileMenu />
    </header>
  );
}
