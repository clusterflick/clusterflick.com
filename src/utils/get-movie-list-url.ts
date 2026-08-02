export function getMovieListUrl(list: { id: string }): string {
  return `/lists/${list.id}`;
}
