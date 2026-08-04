"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { isCurrentNavPath, setUseBrowserBack } from "@/utils/nav-links";
import { MENU_ID } from "./menu-id";
import styles from "./mobile-menu.module.css";

/**
 * A link inside the hamburger menu.
 *
 * Without JS, clicking a link is a full page load, so the menu is gone by
 * definition. With JS, App Router client navigation keeps the header mounted
 * and the popover would stay open, so it's dismissed explicitly here.
 */
export default function MenuLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const pathname = usePathname();
  const isCurrent = isCurrentNavPath(pathname, href);

  return (
    <Link
      href={href}
      className={clsx(styles.navLink, isCurrent && styles.navLinkCurrent)}
      aria-current={isCurrent ? "page" : undefined}
      onClick={() => {
        setUseBrowserBack();
        try {
          document.getElementById(MENU_ID)?.hidePopover();
        } catch {
          // Ignore - the popover may already be closing, or unsupported
        }
      }}
    >
      {label}
    </Link>
  );
}
