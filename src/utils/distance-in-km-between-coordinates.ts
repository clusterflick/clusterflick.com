import type { Position } from "@/types";

const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180;

export default function distanceInKmBetweenCoordinates(
  startPosition: Position,
  endPosition: Position,
) {
  const earthRadiusKm = 6371;

  const latDisance = degreesToRadians(endPosition.lat - startPosition.lat);
  const lonDistance = degreesToRadians(endPosition.lon - startPosition.lon);
  const startLat = degreesToRadians(startPosition.lat);
  const endLat = degreesToRadians(endPosition.lat);

  const haversine =
    Math.sin(latDisance / 2) * Math.sin(latDisance / 2) +
    Math.sin(lonDistance / 2) *
      Math.sin(lonDistance / 2) *
      Math.cos(startLat) *
      Math.cos(endLat);

  const centralAngle =
    2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return earthRadiusKm * centralAngle;
}
