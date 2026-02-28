export function getFilmClubUrl(club: { id: string }): string {
  return `/film-clubs/${club.id}`;
}
