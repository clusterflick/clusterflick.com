import styles from "./spinner.module.css";

interface SpinnerProps {
  size?: number;
}

export default function Spinner({ size = 40 }: SpinnerProps) {
  return (
    <div className={styles.spinner} style={{ width: size, height: size }} />
  );
}
