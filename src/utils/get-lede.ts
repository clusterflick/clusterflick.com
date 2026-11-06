/**
 * A description's first sentence. The registry descriptions are written for
 * search ("Find horror films showing across London…"), and on an index card
 * the rest says nothing the posters and counts don't, while crowding out the
 * line that sets the tone.
 */
export function getLede(description: string): string {
  return description.split(/(?<=[.!?])\s/)[0];
}
