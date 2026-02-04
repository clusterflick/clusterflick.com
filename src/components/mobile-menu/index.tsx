"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MenuIcon, CloseIcon } from "@/components/icons";
import styles from "./mobile-menu.module.css";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div className={styles.mobileMenu}>
      <button
        type="button"
        className={styles.menuButton}
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        aria-expanded={isOpen}
      >
        <MenuIcon size={24} />
      </button>

      {isOpen && (
        <>
          <div
            className={styles.overlay}
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            className={styles.menuPanel}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <CloseIcon size={24} />
            </button>
            <nav className={styles.nav} aria-label="Main navigation">
              <Link
                href="/about"
                className={styles.navLink}
                onClick={() => {
                  setIsOpen(false);
                  try {
                    sessionStorage.setItem("useBrowserBack", "true");
                  } catch {
                    // Ignore - UX optimization only
                  }
                }}
              >
                About
              </Link>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
