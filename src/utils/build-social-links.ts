import type { ComponentType } from "react";
import { LetterboxdIcon, InstagramIcon, XIcon } from "@/components/icons";

export type SocialHandles = {
  letterboxd: string | null;
  twitter: string | null;
  instagram: string | null;
} | null;

export type SocialLink = {
  Icon: ComponentType<{ size?: number }>;
  name: string;
  url: string;
  handle: string;
};

/**
 * Build the outbound social links for a set of handles (venue or cinema group).
 * Order is stable: Letterboxd, Instagram, X/Twitter. Missing handles are skipped.
 */
export function buildSocialLinks(
  socials: SocialHandles | undefined,
): SocialLink[] {
  const links: SocialLink[] = [];

  if (!socials) return links;

  if (socials.letterboxd) {
    links.push({
      Icon: LetterboxdIcon,
      name: "Letterboxd",
      url: `https://letterboxd.com/${socials.letterboxd}/`,
      handle: socials.letterboxd,
    });
  }
  if (socials.instagram) {
    links.push({
      Icon: InstagramIcon,
      name: "Instagram",
      url: `https://www.instagram.com/${socials.instagram}/`,
      handle: socials.instagram,
    });
  }
  if (socials.twitter) {
    links.push({
      Icon: XIcon,
      name: "X / Twitter",
      url: `https://x.com/${socials.twitter}/`,
      handle: socials.twitter,
    });
  }

  return links;
}
