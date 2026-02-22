"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface FestivalRedirectProps {
  canonicalUrl: string;
}

export default function FestivalRedirect({
  canonicalUrl,
}: FestivalRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    router.replace(canonicalUrl);
  }, [canonicalUrl, router]);

  return null;
}
