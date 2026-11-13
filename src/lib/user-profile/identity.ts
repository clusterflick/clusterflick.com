/**
 * What a reader can say about themselves on their profile: a display name, and
 * links to their profiles elsewhere. Kept to film: Letterboxd, IMDb, and one
 * website of their own.
 *
 * Everything here is checked three times: as it's typed (the form strips what
 * a name can't hold), by the rules (`isDisplayName` and `isProfileLinks` in
 * `firestore.rules`, held to this module by a test), and when read back, by
 * the profiles Worker and by the page, so a hand edit can't put anything else
 * on a profile either.
 */

export const DISPLAY_NAME_MAX_LENGTH = 50;

/**
 * Code point ranges a display name may never hold. The name is written into
 * the profile page's `<head>` and into Next's inline payload, where it sits
 * as a JSON string inside a JavaScript string, and stripping these is what
 * makes it plain text in all of them, with nothing to escape:
 *
 * - `"` `&` `<` `>` `\`: the characters HTML and JSON give meaning to. An
 *   apostrophe is allowed (O'Brien): nothing it's written into is quoted
 *   with one.
 * - Control characters (C0, DEL and C1), and the line and paragraph
 *   separators, which are invisible and can break a line of script.
 * - The bidirectional embeddings, overrides and isolates, which can make a
 *   name display as something it isn't.
 *
 * Repeated in `firestore.rules`, and in the profiles Worker.
 */
export const FORBIDDEN_NAME_RANGES: readonly (readonly [number, number])[] = [
  [0x00, 0x1f],
  [0x22, 0x22],
  [0x26, 0x26],
  [0x3c, 0x3c],
  [0x3e, 0x3e],
  [0x5c, 0x5c],
  [0x7f, 0x9f],
  [0x2028, 0x2029],
  [0x202a, 0x202e],
  [0x2066, 0x2069],
];

const hex = (codePoint: number) => codePoint.toString(16).toUpperCase();

const FORBIDDEN_NAME_CHARACTERS = new RegExp(
  `[${FORBIDDEN_NAME_RANGES.map(([from, to]) =>
    from === to ? `\\u{${hex(from)}}` : `\\u{${hex(from)}}-\\u{${hex(to)}}`,
  ).join("")}]`,
  "gu",
);

/**
 * The same ranges as an RE2 character class's contents, as `firestore.rules`
 * writes them inside a string (so each backslash is doubled). For the test
 * holding the rules to this module.
 */
export function getForbiddenNameClassForRules(): string {
  return FORBIDDEN_NAME_RANGES.map(([from, to]) =>
    from === to
      ? `\\\\x{${hex(from)}}`
      : `\\\\x{${hex(from)}}-\\\\x{${hex(to)}}`,
  ).join("");
}

/** A name's length as the rules count it: in characters, not UTF-16 units. */
export function getNameLength(name: string): number {
  return [...name].length;
}

/**
 * A display name with everything it can't hold taken out, runs of space made
 * one, and trimmed. Also any `$` it starts with: Next's payload reads a string
 * starting with `$` as a reference, and the page title starts with the name.
 * What it returns may still be too long, or empty.
 */
export function sanitiseDisplayName(input: string): string {
  return input
    .replace(FORBIDDEN_NAME_CHARACTERS, "")
    .replace(/\s+/gu, " ")
    .trim()
    .replace(/^[$\s]+/u, "");
}

/**
 * What the form keeps of each keystroke: the characters a name can't hold
 * dropped as they're typed, so nobody is told off for one, but spaces kept
 * where they are, since a trailing one is usually the next word starting.
 */
export function stripDisplayNameInput(input: string): string {
  return input.replace(FORBIDDEN_NAME_CHARACTERS, "");
}

/**
 * A saved name, stripped again as it's read: the rules refuse anything else,
 * but a hand edit skips them. Undefined if nothing is left, or too much.
 */
export function readDisplayName(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const name = sanitiseDisplayName(value);
  if (name.length === 0 || getNameLength(name) > DISPLAY_NAME_MAX_LENGTH) {
    return undefined;
  }
  return name;
}

export enum ProfileLinkId {
  Letterboxd = "letterboxd",
  Imdb = "imdb",
  Website = "website",
}

/** Each link, if the reader gave one. Stored as identifiers, not addresses. */
export type ProfileLinks = Partial<Record<ProfileLinkId, string>>;

/** In the order the profile shows them. */
export const PROFILE_LINK_IDS: readonly ProfileLinkId[] =
  Object.values(ProfileLinkId);

/**
 * A Letterboxd username: letters, numbers and underscores, which is what
 * Letterboxd allows (no hyphens). Its length limit isn't published, so 50 is
 * a generous cap rather than Letterboxd's own.
 */
const LETTERBOXD_PATTERN = /^[A-Za-z0-9_]{1,50}$/;

/**
 * IMDb's user ids, as they appear in `imdb.com/user/<id>/`: `ur` and digits
 * for older accounts, and `p.` and lowercase letters and digits for newer
 * ones (`p.mbd2yexnoms6latfrdkzba2zxy`).
 */
const IMDB_PATTERN = /^(?:ur[0-9]{1,12}|p\.[a-z0-9]{1,40})$/;

export const WEBSITE_MAX_LENGTH = 200;

/**
 * An https address with nothing in it that HTML or JSON give meaning to. The
 * rules check this much; the form and readers also parse it as a URL.
 */
const WEBSITE_PATTERN = /^https:\/\/[^\s<>"\\]+$/;

const LINK_PATTERNS: Record<ProfileLinkId, RegExp> = {
  [ProfileLinkId.Letterboxd]: LETTERBOXD_PATTERN,
  [ProfileLinkId.Imdb]: IMDB_PATTERN,
  [ProfileLinkId.Website]: WEBSITE_PATTERN,
};

/** The patterns' sources, for the test holding the rules to them. */
export const LINK_PATTERN_SOURCES: Record<ProfileLinkId, string> = {
  [ProfileLinkId.Letterboxd]: LETTERBOXD_PATTERN.source,
  [ProfileLinkId.Imdb]: IMDB_PATTERN.source,
  [ProfileLinkId.Website]: WEBSITE_PATTERN.source,
};

function isWebsite(value: string): boolean {
  if (value.length > WEBSITE_MAX_LENGTH || !WEBSITE_PATTERN.test(value)) {
    return false;
  }
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      url.hostname.includes(".")
    );
  } catch {
    return false;
  }
}

/** Whether a stored link is one the profile can show. */
export function isProfileLink(id: ProfileLinkId, value: unknown): boolean {
  if (typeof value !== "string") return false;
  return id === ProfileLinkId.Website
    ? isWebsite(value)
    : LINK_PATTERNS[id].test(value);
}

/** The saved links the profile can show; anything else is dropped. */
export function readProfileLinks(value: unknown): ProfileLinks {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  const map = value as Record<string, unknown>;
  return Object.fromEntries(
    PROFILE_LINK_IDS.filter((id) => isProfileLink(id, map[id])).map((id) => [
      id,
      map[id],
    ]),
  ) as ProfileLinks;
}

/** Where a link goes. */
export function getProfileLinkUrl(id: ProfileLinkId, value: string): string {
  switch (id) {
    case ProfileLinkId.Letterboxd:
      return `https://letterboxd.com/${value}/`;
    case ProfileLinkId.Imdb:
      return `https://www.imdb.com/user/${value}/`;
    case ProfileLinkId.Website:
      return value;
  }
}

/** What a link is called on the profile: the site, or the website's host. */
export function getProfileLinkLabel(id: ProfileLinkId, value: string): string {
  switch (id) {
    case ProfileLinkId.Letterboxd:
      return "Letterboxd";
    case ProfileLinkId.Imdb:
      return "IMDb";
    case ProfileLinkId.Website:
      return new URL(value).hostname.replace(/^www\./, "");
  }
}

export type LinkInput = { value: string } | { problem: string };

/**
 * What the reader typed, as it would be saved: a username or id on its own,
 * or the address of their profile there, which is what most will paste. An
 * empty field is no link.
 */
export function parseLinkInput(id: ProfileLinkId, input: string): LinkInput {
  const text = input.trim();
  if (!text) return { value: "" };
  switch (id) {
    case ProfileLinkId.Letterboxd: {
      const fromUrl = text.match(
        /^(?:https?:\/\/)?(?:www\.)?letterboxd\.com\/([^/?#]+)\/?(?:[?#].*)?$/i,
      )?.[1];
      const username = fromUrl ?? text.replace(/^@/, "");
      return LETTERBOXD_PATTERN.test(username)
        ? { value: username }
        : {
            problem:
              "Your Letterboxd username, or the address of your profile there",
          };
    }
    case ProfileLinkId.Imdb: {
      const fromUrl = text.match(
        /^(?:https?:\/\/)?(?:(?:www|m)\.)?imdb\.com\/user\/([^/?#]+)\/?(?:[?#].*)?$/i,
      )?.[1];
      const userId = fromUrl ?? text;
      return IMDB_PATTERN.test(userId)
        ? { value: userId }
        : {
            problem:
              "The address of your IMDb profile, like imdb.com/user/p.abc123",
          };
    }
    case ProfileLinkId.Website: {
      if (/^http:\/\//i.test(text)) {
        return { problem: "Use the https:// address" };
      }
      const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(text)
        ? text
        : `https://${text}`;
      let href: string;
      try {
        href = new URL(withScheme).href;
      } catch {
        return { problem: "That doesn't look like a web address" };
      }
      if (href.length > WEBSITE_MAX_LENGTH) {
        return { problem: `At most ${WEBSITE_MAX_LENGTH} characters` };
      }
      return isWebsite(href)
        ? { value: href }
        : { problem: "That doesn't look like a web address" };
    }
  }
}
