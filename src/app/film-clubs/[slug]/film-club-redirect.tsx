"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface FilmClubRedirectProps {
  canonicalUrl: string;
}

export default function FilmClubRedirect({
  canonicalUrl,
}: FilmClubRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    router.replace(canonicalUrl);
  }, [canonicalUrl, router]);

  return null;
}
