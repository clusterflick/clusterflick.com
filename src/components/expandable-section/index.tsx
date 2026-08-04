"use client";

import { useState, ReactNode, useId, useRef } from "react";
import clsx from "clsx";
import styles from "./expandable-section.module.css";

interface ExpandableSectionProps {
  /**
   * What the section holds, as a noun phrase — "Individual Venues", "More Event
   * Options". The trigger prefixes it with Show/Hide, so it reads as the action
   * it performs rather than as a heading someone might not think to press.
   */
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
}

export default function ExpandableSection({
  title,
  children,
  defaultExpanded = false,
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentId = useId();

  const handleToggle = () => {
    const nextExpanded = !isExpanded;
    setIsExpanded(nextExpanded);

    // These triggers sit at the bottom of their section, so they're commonly
    // tapped while near the bottom of the viewport — where everything they
    // reveal would open below the fold, looking like nothing happened. Pulling
    // the trigger to the middle of the screen puts the new content in view.
    // Only on expand: collapsing loses nothing, so moving the page would just
    // be disorienting.
    if (!nextExpanded) return;
    requestAnimationFrame(() => {
      triggerRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center",
      });
    });
  };

  return (
    <div className={styles.container}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls={contentId}
      >
        <span className={styles.title}>
          {isExpanded ? "Hide" : "Show"} {title}
        </span>
        <span
          className={clsx(styles.icon, isExpanded && styles.expanded)}
          aria-hidden="true"
        >
          <svg
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 1.5L6 6.5L11 1.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      <div
        id={contentId}
        className={clsx(styles.content, isExpanded && styles.expanded)}
        hidden={!isExpanded}
      >
        {children}
      </div>
    </div>
  );
}
