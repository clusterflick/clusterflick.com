import { MenuIcon, CloseIcon } from "@/components/icons";
import { GROUPED_NAV_LINKS } from "@/utils/nav-links";
import MenuLink from "./menu-link";
import { MENU_ID } from "./menu-id";
import styles from "./mobile-menu.module.css";

/**
 * The always-visible hamburger menu, exposing the full navigation list at every
 * screen size.
 *
 * Open/close is driven entirely by the HTML Popover API — no JS — so the menu
 * works before hydration and with JS disabled. The browser also provides light
 * dismiss (Escape and click-outside) and the `aria-expanded` mapping on the
 * invoker, so none of that is hand-rolled here.
 *
 * The panel is promoted to the top layer when open, which is what lets it live
 * inside the header despite the header's `backdrop-filter` (a filter otherwise
 * makes an element the containing block for its fixed-position descendants) and
 * its `z-index` stacking context.
 */
export default function MobileMenu() {
  return (
    <div className={styles.mobileMenu}>
      <button
        type="button"
        className={styles.menuButton}
        popoverTarget={MENU_ID}
        popoverTargetAction="show"
        aria-label="Open menu"
      >
        <MenuIcon size={24} />
      </button>
      <div id={MENU_ID} popover="auto" className={styles.menuLayer}>
        {/*
         * The dimmed page behind the panel. A real button rather than a styled
         * ::backdrop: pseudo-elements aren't hit-testable, so the browser's own
         * click-outside dismissal lets the click land on whatever is underneath
         * and follows the link you happened to dim. This absorbs the click and
         * hides the menu instead. Not focusable — Escape and the close button
         * are the keyboard routes out.
         */}
        <button
          type="button"
          className={styles.overlay}
          popoverTarget={MENU_ID}
          popoverTargetAction="hide"
          tabIndex={-1}
          aria-hidden="true"
        />
        <div className={styles.menuPanel}>
          <button
            type="button"
            className={styles.closeButton}
            popoverTarget={MENU_ID}
            popoverTargetAction="hide"
            aria-label="Close menu"
          >
            <CloseIcon size={24} />
          </button>
          {/*
           * Grouped rather than one flat run: the list is long enough that
           * scanning it needs the categories, and the headings give the scroll
           * some landmarks. Each group is its own labelled nav so the headings
           * are structure to a screen reader, not just larger text.
           */}
          <div className={styles.nav}>
            {GROUPED_NAV_LINKS.map(({ id, label, links }) => (
              <nav key={id} className={styles.navGroup} aria-label={label}>
                <h2 className={styles.navGroupHeading}>{label}</h2>
                {links.map((link) => (
                  <MenuLink
                    key={link.href}
                    href={link.href}
                    label={link.label}
                  />
                ))}
              </nav>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
