/**
 * Past this many characters a title is set smaller as a page heading. Real
 * film titles rarely come near it; event listings that pack a whole lineup
 * into the title ("Voiceworks launch - Nisha Ramayya / Laurel Uziell / …")
 * run to 150 or more, and at full size fill six lines.
 */
export const LONG_TITLE_LENGTH = 60;

export function isLongTitle(title: string): boolean {
  return title.length > LONG_TITLE_LENGTH;
}
