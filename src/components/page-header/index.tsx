"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@/components/icons";
import HeaderNav from "@/components/header-nav";
import MobileMenu from "@/components/mobile-menu";
import { useCinemaData } from "@/state/cinema-data-context";
import styles from "./page-header.module.css";

interface PageHeaderProps {
  /**
   * Parent route for the back link, with its label. Provide both or neither.
   *
   * Only set these where the page genuinely has a parent — a venue inside
   * Venues, a festival inside Festivals. Section pages are siblings of each
   * other, not children of the films grid, and reach the rest of the site
   * through the nav rather than a back link.
   */
  backUrl?: string;
  backText?: string;
}

/**
 * The compact header worn by every page except the home page and the films
 * grid, which use MainHeader to make room for the filter summary.
 *
 * It carries the same navigation as MainHeader — the inline primary links and
 * the always-visible hamburger — so the whole site is reachable from anywhere,
 * with an optional back link for pages that sit under a parent route.
 */
export default function PageHeader({ backUrl, backText }: PageHeaderProps) {
  const { isLoading } = useCinemaData();
  const router = useRouter();

  // Initialize from sessionStorage using lazy initializer to avoid effect
  // Used for UX optimization - not critical if sessionStorage is unavailable
  const [useBrowserBack] = useState(() => {
    try {
      if (typeof window === "undefined") return false;
      const flag = sessionStorage.getItem("useBrowserBack");
      if (flag === "true") {
        sessionStorage.removeItem("useBrowserBack");
        return true;
      }
    } catch {
      // sessionStorage may be unavailable (private browsing, storage disabled, etc.)
    }
    return false;
  });

  const handleBack = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (useBrowserBack) {
      e.preventDefault();
      router.back();
    }
  };

  return (
    <div className={styles.header}>
      {/*
       * HeaderNav measures the right edge of this group to work out how many
       * inline links fit, the same way it uses the wordmark on MainHeader.
       */}
      <div className={styles.identity} data-header-logo>
        <Link href="/" className={styles.logo} aria-label="Clusterflick — home">
          <Image
            src="/images/icon.svg"
            alt="Clusterflick"
            width={32}
            height={32}
            className={isLoading ? styles.spinning : ""}
          />
        </Link>
        {backUrl && backText && (
          <Link
            href={backUrl}
            className={styles.backButton}
            onClick={handleBack}
          >
            <ArrowLeftIcon />
            <span>{backText}</span>
          </Link>
        )}
      </div>
      <div className={styles.navGroup}>
        <HeaderNav />
        <MobileMenu />
      </div>
    </div>
  );
}
