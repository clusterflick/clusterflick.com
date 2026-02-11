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
}: {
  isFilterOverlayOpen: boolean;
  onFilterClick: () => void;
  onFilterTextHeightChange?: (height: number) => void;
}) {
  return (
    <header className={styles.header}>
      <HeaderLogo />
      <div className={styles.filter}>
        <FilterTrigger
          onClick={onFilterClick}
          isOverlayOpen={isFilterOverlayOpen}
          onTextHeightChange={onFilterTextHeightChange}
        />
      </div>
      <HeaderNav />
      <MobileMenu />
    </header>
  );
}
