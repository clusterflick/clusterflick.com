"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@/components/icons";
import { useCinemaData } from "@/state/cinema-data-context";
import styles from "./page-header.module.css";

interface PageHeaderProps {
  backUrl: string;
  backText: string;
}

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
      <Link href={backUrl} className={styles.backButton} onClick={handleBack}>
        <ArrowLeftIcon />
        <span>{backText}</span>
      </Link>
      <Image
        src="/images/icon.svg"
        alt="Clusterflick"
        width={32}
        height={32}
        className={isLoading ? styles.spinning : ""}
      />
    </div>
  );
}
