"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import PageHeader from "@/components/page-header";
import PageWrapper from "@/components/page-wrapper";
import styles from "./status-page.module.css";

interface StatusPageProps {
  /** Icon image source path */
  iconSrc: string;
  /** Icon dimensions */
  iconSize?: { width: number; height: number };
  /** Page title */
  title: string;
  /** Message content - can be a string or JSX */
  message: ReactNode;
  /** Action buttons/links */
  actions?: ReactNode;
  /** Optional back navigation */
  backLink?: {
    url: string;
    text: string;
  };
}

/**
 * A reusable status page layout for error, not-found, and similar pages.
 * Provides a centered content area with gradient background.
 */
export default function StatusPage({
  iconSrc,
  iconSize = { width: 180, height: 120 },
  title,
  message,
  actions,
  backLink,
}: StatusPageProps) {
  return (
    <PageWrapper>
      {backLink && (
        <PageHeader backUrl={backLink.url} backText={backLink.text} />
      )}

      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <Image
            src={iconSrc}
            alt=""
            width={iconSize.width}
            height={iconSize.height}
            className={styles.icon}
            priority
          />
        </div>

        <h1 className={styles.title}>{title}</h1>

        <p className={styles.message}>{message}</p>

        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </PageWrapper>
  );
}

/**
 * A minimal loading variant of the status page.
 */
export function StatusPageLoading({ children }: { children: ReactNode }) {
  return (
    <PageWrapper>
      <div className={styles.content}>{children}</div>
    </PageWrapper>
  );
}
