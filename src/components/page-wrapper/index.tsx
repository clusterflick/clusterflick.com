import type { ReactNode } from "react";
import clsx from "clsx";
import styles from "./page-wrapper.module.css";

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

/**
 * A wrapper component that provides the gradient blob background.
 * Use this for full-page layouts that need the signature mesh gradient.
 */
export default function PageWrapper({ children, className }: PageWrapperProps) {
  return (
    <main id="main-content" className={clsx(styles.wrapper, className)}>
      {children}
    </main>
  );
}
