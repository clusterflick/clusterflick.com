import { CrossIcon, TickIcon } from "@/components/icons";
import styles from "./page.module.css";

/**
 * One line of what something shares or doesn't (an assistant's scopes, a
 * profile's sections): a tick or a cross ahead of the wording, so on and off
 * read apart at a glance. Goes in a `styles.onOffList`.
 */
export default function OnOffItem({
  on,
  label,
}: {
  on: boolean;
  label: string;
}) {
  const Icon = on ? TickIcon : CrossIcon;
  return (
    <li className={on ? styles.onOffItemOn : styles.onOffItemOff}>
      <Icon size={14} aria-hidden="true" className={styles.onOffIcon} />
      <span>
        {label}
        <span className={styles.visuallyHidden}>{on ? " (on)" : " (off)"}</span>
      </span>
    </li>
  );
}
