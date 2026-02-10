"use client";

import { useEffect } from "react";
import { useCinemaData } from "@/state/cinema-data-context";

export default function PreloadCinemaData() {
  const { getData } = useCinemaData();

  useEffect(() => {
    getData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
