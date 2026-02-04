"use client";

import { useState } from "react";
import Button from "@/components/button";
import styles from "./credits-list.module.css";

interface CreditsListProps {
  role: string;
  names: string[];
  maxDisplay?: number;
}

export default function CreditsList({
  role,
  names,
  maxDisplay,
}: CreditsListProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldTruncate = maxDisplay && names.length > maxDisplay;
  const displayNames =
    shouldTruncate && !isExpanded ? names.slice(0, maxDisplay) : names;
  const remainingCount = maxDisplay ? names.length - maxDisplay : 0;

  return (
    <div>
      <h3 className={styles.role}>{role}</h3>
      <div className={styles.list}>
        {displayNames.map((name, index) => (
          <span key={`${name}-${index}`} className={styles.name}>
            {name}
          </span>
        ))}
        {shouldTruncate && !isExpanded && (
          <Button
            variant="link"
            onClick={() => setIsExpanded(true)}
            aria-expanded="false"
            aria-label={`Show ${remainingCount} more ${role.toLowerCase()}`}
          >
            +{remainingCount} more
          </Button>
        )}
        {shouldTruncate && isExpanded && (
          <Button
            variant="link"
            onClick={() => setIsExpanded(false)}
            aria-expanded="true"
            aria-label={`Show fewer ${role.toLowerCase()}`}
          >
            Show less
          </Button>
        )}
      </div>
    </div>
  );
}
