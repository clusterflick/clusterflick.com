import type { ReactNode } from "react";
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
    <div className={`${styles.wrapper} ${className || ""}`}>{children}</div>
  );
}
