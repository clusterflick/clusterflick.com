import HeaderLogo from "@/components/header-logo";
import FilterTrigger from "@/components/filter-trigger";
import HeaderNav from "@/components/header-nav";
import MobileMenu from "@/components/mobile-menu";
import styles from "./main-header.module.css";

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
    <div className={styles.header}>
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
    </div>
  );
}
