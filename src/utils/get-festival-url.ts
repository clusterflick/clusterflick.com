export function getFestivalUrl(festival: { id: string }): string {
  return `/festivals/${festival.id}`;
}
