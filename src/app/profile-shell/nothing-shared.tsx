import PopcornLogo from "@/components/popcorn-logo";
import styles from "./page.module.css";

/**
 * A profile with every section switched off: the popcorn, knocked over, and
 * a line saying there's nothing to see. Drawn by the profile page and by the
 * preview beside the settings, so the owner sees it as they switch the last
 * one off.
 */
export default function NothingShared({ ownerName }: { ownerName: string }) {
  return (
    <div className={styles.nothingShared}>
      <PopcornLogo spilled size={240} />
      <p className={styles.nothingShown}>
        {ownerName} isn&apos;t sharing any lists yet.
      </p>
    </div>
  );
}
