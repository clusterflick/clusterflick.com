"use client";

import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import OutlineHeading from "@/components/outline-heading";
import { useCinemaData } from "@/state/cinema-data-context";
import styles from "./header-logo.module.css";

export default function HeaderLogo() {
  const { isLoading } = useCinemaData();

  return (
    <Link className={styles.home} href="/" aria-label="Clusterflick — home">
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
