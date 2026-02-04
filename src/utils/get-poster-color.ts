/**
 * Get a consistent color for a movie poster placeholder based on title.
 * Uses a simple hash to ensure the same title always gets the same color.
 */
export function getPosterColor(title: string): "pink" | "blue" | "yellow" {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash = hash & hash;
  }
  const colors = ["pink", "blue", "yellow"] as const;
  return colors[Math.abs(hash) % 3];
}
