import styles from "./divider.module.css";

export default function Divider({ style }: { style?: React.CSSProperties }) {
  return <hr className={styles.divider} style={style} />;
}
