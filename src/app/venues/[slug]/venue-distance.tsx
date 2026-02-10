"use client";

import { useEffect, useState } from "react";
import { fetchGeolocationIfPermissionGranted } from "@/utils/fetch-geolocation";
import { getDistanceInMiles } from "@/utils/geo-distance";

interface VenueDistanceProps {
  venueLat: number;
  venueLon: number;
  className?: string;
}

export default function VenueDistance({
  venueLat,
  venueLon,
  className,
}: VenueDistanceProps) {
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    fetchGeolocationIfPermissionGranted().then((position) => {
      if (position) {
        const miles = getDistanceInMiles(position, {
          lat: venueLat,
          lon: venueLon,
        });
        setDistance(miles);
      }
    });
  }, [venueLat, venueLon]);

  if (distance === null) return null;

  const formatted =
    distance < 0.1
      ? "Nearby"
      : distance < 10
        ? `${distance.toFixed(1)} miles away`
        : `${Math.round(distance)} miles away`;

  return <span className={className}>{formatted}</span>;
}
