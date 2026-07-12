"use client";

import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import OutlineHeading from "@/components/outline-heading";
import { useCinemaData } from "@/state/cinema-data-context";
import styles from "./header-logo.module.css";

export default function HeaderLogo({
  hasFilter = false,
}: {
  /** True on pages that render the filter summary, which competes for header space. */
  hasFilter?: boolean;
}) {
  const { isLoading } = useCinemaData();

  return (
    <Link
      className={clsx(styles.home, hasFilter && styles.withFilter)}
      href="/"
      aria-label="Clusterflick — home"
      data-header-logo
    >
      <Image
        src="/images/icon.svg"
        alt="Clusterflick"
        width={40}
        height={40}
        className={clsx(styles.logo, isLoading && styles.spinning)}
      />
      <OutlineHeading as="div">Clusterflick</OutlineHeading>
    </Link>
  );
}
