import { OccasionType } from "@/types";

/**
 * Each kind of occasion as it reads with nobody named: a filter pill, or a
 * performance's tag when the venue named no one.
 */
export const OCCASION_LABELS: Record<OccasionType, string> = {
  [OccasionType.LiveScore]: "Live score",
  [OccasionType.Intro]: "Intro",
  [OccasionType.QAndA]: "Q&A",
  [OccasionType.InConversation]: "In conversation",
  [OccasionType.Panel]: "Panel discussion",
  [OccasionType.GuestAppearance]: "Guest appearance",
  [OccasionType.Premiere]: "Premiere",
  [OccasionType.Preview]: "Preview",
};
