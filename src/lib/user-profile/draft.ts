import {
  ALL_PROFILE_SECTIONS,
  DISPLAY_NAME_MAX_LENGTH,
  getHandleProblem,
  getNameLength,
  HANDLE_PROBLEM_MESSAGES,
  normaliseHandle,
  parseLinkInput,
  PROFILE_LINK_IDS,
  PROFILE_SECTION_IDS,
  ProfileLinkId,
  sanitiseDisplayName,
  type FavouriteFilm,
  type ProfileLinks,
  type ProfileSections,
  type UserProfile,
} from ".";
import { sameFavourites } from "./favourites";

/**
 * Everything on the profile settings page, as the reader has it typed: one
 * draft, saved with one button. The fields hold what was typed (a pasted
 * Letterboxd address, a name with a trailing space), and `readDraft` turns
 * it into what would be saved.
 */
export type ProfileDraft = {
  handle: string;
  name: string;
  links: Record<ProfileLinkId, string>;
  favourites: FavouriteFilm[];
  sections: ProfileSections;
};

/** The draft a saved profile starts from, or a new one's. */
export function getProfileDraft(profile: UserProfile | null): ProfileDraft {
  return {
    handle: profile?.handle ?? "",
    name: profile?.displayName ?? "",
    links: Object.fromEntries(
      PROFILE_LINK_IDS.map((id) => [id, profile?.links?.[id] ?? ""]),
    ) as Record<ProfileLinkId, string>,
    favourites: profile?.favourites ?? [],
    // A profile from before sections showed everything, and starts there.
    sections: profile?.sections ?? ALL_PROFILE_SECTIONS,
  };
}

export type DraftProblems = {
  handle?: string;
  name?: string;
  links: Partial<Record<ProfileLinkId, string>>;
};

/** What the draft would save, bar `public`, and what stops it saving. */
export type ReadDraft = {
  value: Omit<UserProfile, "public">;
  problems: DraftProblems;
  /** Nothing in `problems`. */
  valid: boolean;
};

export function readDraft(draft: ProfileDraft): ReadDraft {
  const handle = normaliseHandle(draft.handle);
  const handleProblem = handle
    ? getHandleProblem(handle)
    : ("too-short" as const);
  const displayName = sanitiseDisplayName(draft.name);
  const links: ProfileLinks = {};
  const linkProblems: Partial<Record<ProfileLinkId, string>> = {};
  for (const id of PROFILE_LINK_IDS) {
    const result = parseLinkInput(id, draft.links[id]);
    if ("problem" in result) linkProblems[id] = result.problem;
    else if (result.value) links[id] = result.value;
  }
  const problems: DraftProblems = {
    ...(handleProblem && {
      handle: handle
        ? HANDLE_PROBLEM_MESSAGES[handleProblem]
        : "Choose an address",
    }),
    ...(getNameLength(displayName) > DISPLAY_NAME_MAX_LENGTH && {
      name: `At most ${DISPLAY_NAME_MAX_LENGTH} characters`,
    }),
    links: linkProblems,
  };
  return {
    value: {
      handle,
      ...(displayName && { displayName }),
      ...(Object.keys(links).length > 0 && { links }),
      ...(draft.favourites.length > 0 && { favourites: draft.favourites }),
      sections: draft.sections,
    },
    problems,
    valid:
      !problems.handle &&
      !problems.name &&
      Object.keys(problems.links).length === 0,
  };
}

const sameLinks = (a: ProfileLinks = {}, b: ProfileLinks = {}) =>
  PROFILE_LINK_IDS.every((id) => (a[id] ?? "") === (b[id] ?? ""));

const sameSections = (a: ProfileSections, b?: ProfileSections) =>
  b !== undefined && PROFILE_SECTION_IDS.every((id) => a[id] === b[id]);

/**
 * Whether saving would change anything. A profile without sections counts
 * as changed, since saving is what records the reader's choice.
 */
export function isDraftChanged(
  read: ReadDraft["value"],
  saved: UserProfile | null,
): boolean {
  if (!saved) return true;
  return (
    read.handle !== saved.handle ||
    (read.displayName ?? "") !== (saved.displayName ?? "") ||
    !sameLinks(read.links, saved.links) ||
    !sameFavourites(read.favourites ?? [], saved.favourites) ||
    !sameSections(read.sections!, saved.sections)
  );
}
