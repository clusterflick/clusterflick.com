"use client";

import { useEffect } from "react";
import { CloseIcon } from "@/components/icons";
import Tag from "@/components/tag";
import styles from "./sources-popup.module.css";

interface SourcesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  sources: Array<{ source: string; count: number }>;
}

export default function SourcesPopup({
  isOpen,
  onClose,
  sources,
}: SourcesPopupProps) {
  // Close on Escape while open
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Event sources"
      onClick={onClose}
    >
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Event Sources</h2>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon size={20} />
          </button>
        </div>
        <ol className={styles.list}>
          {sources.map(({ source, count }) => (
            <li key={source}>
              <div className={styles.row}>
                <code>{source}</code>
                <Tag color="blue" size="sm" className={styles.count}>
                  {count.toLocaleString("en-GB")}
                </Tag>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
