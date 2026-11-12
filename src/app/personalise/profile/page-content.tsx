"use client";

import { useEffect, useState, type ReactNode } from "react";
import clsx from "clsx";
import Button, { ButtonAnchor, ButtonLink } from "@/components/button";
import EmptyState from "@/components/empty-state";
import LoadingIndicator from "@/components/loading-indicator";
import StandardPageLayout from "@/components/standard-page-layout";
import Switch from "@/components/switch";
import { useUserContext } from "@/state/user-context";
import { UserListId } from "@/lib/user-lists";
import type { FilmDetailsData } from "@/lib/user-lists/film-details";
import {
  ALL_PROFILE_SECTIONS,
  getHandleProblem,
  getProfilePath,
  HANDLE_MAX_LENGTH,
  HANDLE_PROBLEM_MESSAGES,
  DISPLAY_NAME_MAX_LENGTH,
  getNameLength,
  parseLinkInput,
  PROFILE_LINK_IDS,
  PROFILE_SECTION_IDS,
  ProfileLinkId,
  ProfileSectionId,
  sanitiseDisplayName,
  stripDisplayNameInput,
  type ProfileLinks,
  type ProfileSections,
  type UserProfile,
} from "@/lib/user-profile";
import {
  MIN_STATS_FILMS,
  type MovieListProgressItem,
} from "@/app/personalise/seen-stats";
import {
  ProfileWithdrawnNotice,
  SAVE_FAILED,
  useProfileSave,
  usePublicProfile,
  type PublicProfileState,
} from "@/app/personalise/public-profile";
import ProfileView, {
  getProfileHeading,
  ProfileLinksRow,
} from "@/app/profile-shell/profile-view";
import personaliseStyles from "@/app/personalise/page.module.css";
import styles from "./page.module.css";

const PERSONALISE_PATH = "/personalise/";

type BuildData = {
  venueImagePaths: Record<string, string>;
  movieLists: MovieListProgressItem[];
};

/**
 * Where a reader with the `publicProfile` capability sets up their profile, in
 * the order it has to be done: a handle, then a name and links if they want
 * them, then what the page shows, then whether anyone can see it. Going public waits until what's shown has been
 * saved once, so nobody publishes before seeing the choice; the rules enforce
 * the same. A preview below draws the page as visitors will see it, from the
 * choice as it stands, saved or not.
 */
export default function ProfileSettingsPageContent(build: BuildData) {
  const { status } = useUserContext();
  const state = usePublicProfile();
  const signedIn = status === "signed-in";
  const ready = signedIn && state?.granted;
  // The choice as it stands, ahead of saving, for the preview. Held here so
  // the settings and the preview read the same one.
  const [draft, setDraft] = useState<ProfileSections | null>(null);
  const savedSections = state?.profile?.sections;
  const sections = draft ?? savedSections ?? ALL_PROFILE_SECTIONS;
  // The name and links as typed, the parts that would save, for the preview.
  const [identity, setIdentity] = useState<Identity | null>(null);
  const profile = state?.profile;
  const shownIdentity = identity ?? {
    displayName: profile?.displayName,
    links: profile?.links ?? {},
  };

  return (
    <StandardPageLayout
      title="Your Public Profile"
      subtitle="Share your lists at an address of your own, showing as much or as little as you like."
      afterContent={
        ready ? (
          <Preview
            handle={profile?.handle}
            identity={shownIdentity}
            sections={sections}
            {...build}
          />
        ) : undefined
      }
    >
      {status === "unavailable" ? (
        <EmptyState
          icon={{
            src: "/images/icons/neon-projector.svg",
            width: 120,
            height: 120,
          }}
          title="Not available yet"
          message="Personalisation isn't switched on in this build."
        />
      ) : status === "checking" || (signedIn && !state) ? (
        <LoadingIndicator message="Loading your profile…" />
      ) : !signedIn ? (
        <EmptyState
          icon={{
            src: "/images/icons/neon-projector.svg",
            width: 120,
            height: 120,
          }}
          title="Sign in first"
          message="Your profile shows your lists, so it starts with an account."
          actions={<ButtonLink href={PERSONALISE_PATH}>Sign in</ButtonLink>}
        />
      ) : state && !state.granted ? (
        <NotGranted state={state} />
      ) : (
        state && (
          <Settings
            state={state}
            draft={sections}
            onDraftChange={setDraft}
            onIdentityChange={setIdentity}
          />
        )
      )}
    </StandardPageLayout>
  );
}

/**
 * Without the capability there's nothing to set up, except a profile left
 * public when it was revoked, which can still be switched off.
 */
function NotGranted({ state }: { state: PublicProfileState }) {
  if (state.profile?.public) {
    return (
      <ProfileWithdrawnNotice profile={state.profile} onSaved={state.onSaved} />
    );
  }
  return (
    <EmptyState
      icon={{
        src: "/images/icons/neon-projector.svg",
        width: 120,
        height: 120,
      }}
      title="Not switched on for you yet"
      message="Public profiles are being opened up a few readers at a time, and aren't switched on for your account yet."
      actions={
        <ButtonLink href={PERSONALISE_PATH}>Back to Personalise</ButtonLink>
      }
    />
  );
}

function Settings({
  state,
  draft,
  onDraftChange,
  onIdentityChange,
}: {
  state: PublicProfileState;
  draft: ProfileSections;
  onDraftChange: (sections: ProfileSections) => void;
  onIdentityChange: (identity: Identity) => void;
}) {
  const { profile, onSaved } = state;
  return (
    <div className={styles.steps}>
      {profile?.public && !profile.sections && (
        <aside className={personaliseStyles.profileNotice}>
          <p className={personaliseStyles.profileNoticeText}>
            Your profile went public before you could choose what it shows, so
            it shows everything. Have a look below, and save what you want on
            it.
          </p>
        </aside>
      )}
      <HandleStep profile={profile} onSaved={onSaved} />
      <IdentityStep
        profile={profile}
        onSaved={onSaved}
        onIdentityChange={onIdentityChange}
      />
      <SectionsStep
        profile={profile}
        onSaved={onSaved}
        draft={draft}
        onDraftChange={onDraftChange}
      />
      <VisibilityStep profile={profile} onSaved={onSaved} draft={draft} />
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={clsx(personaliseStyles.card, styles.step)}>
      <h2 className={styles.stepTitle}>
        <span className={styles.stepNumber} aria-hidden="true">
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

type StepProps = Pick<PublicProfileState, "profile" | "onSaved">;

/**
 * The handle: saved after checking it's free, with a warning before a rename
 * frees the old address. A profile public from before sections can't be
 * renamed until they're chosen, since the rules refuse it public without
 * them, and the save would only fail.
 */
function HandleStep({ profile, onSaved }: StepProps) {
  const { isHandleTaken } = useUserContext();
  const { save, saving, setSaving, error, setError } = useProfileSave(
    profile,
    onSaved,
  );
  const [handle, setHandle] = useState(profile?.handle ?? "");
  const [confirmingRename, setConfirmingRename] = useState(false);

  const changed = handle !== (profile?.handle ?? "");
  const problem = changed && handle ? getHandleProblem(handle) : null;
  const blockedBySections = Boolean(profile?.public && !profile.sections);

  const onSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (!changed || !handle || getHandleProblem(handle) || blockedBySections)
      return;
    // Renaming frees the old address at once, so it asks first.
    if (profile && !confirmingRename) {
      setConfirmingRename(true);
      return;
    }
    setConfirmingRename(false);
    setSaving(true);
    setError(null);
    try {
      if (await isHandleTaken(handle)) {
        setError("That handle is taken");
        return;
      }
    } catch (checkError) {
      console.error("Failed to check handle", checkError);
      setError(SAVE_FAILED);
      return;
    } finally {
      setSaving(false);
    }
    await save(profile ? { ...profile, handle } : { handle, public: false });
  };

  const message = problem ? HANDLE_PROBLEM_MESSAGES[problem] : error;

  return (
    <Step number={1} title="Your address">
      <p id="profile-handle-help" className={personaliseStyles.managementText}>
        Your profile lives at clusterflick.com/u/<em>your-handle</em>. Letters,
        numbers, - and _, from 3 to {HANDLE_MAX_LENGTH} characters.
      </p>
      <form className={personaliseStyles.row} onSubmit={onSubmit}>
        <input
          className={personaliseStyles.input}
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={HANDLE_MAX_LENGTH}
          aria-label="Handle"
          aria-describedby="profile-handle-help"
          aria-invalid={problem ? true : undefined}
          value={handle}
          onChange={(event) => {
            setHandle(event.target.value.toLowerCase());
            setConfirmingRename(false);
            setError(null);
          }}
          placeholder="your-name"
        />
        <Button
          type="submit"
          size="sm"
          disabled={
            saving ||
            !changed ||
            !handle ||
            problem !== null ||
            blockedBySections
          }
        >
          {profile ? "Change handle" : "Save handle"}
        </Button>
      </form>
      {blockedBySections && changed && (
        <p className={personaliseStyles.managementStatus}>
          Choose what your profile shows first, below.
        </p>
      )}
      {confirmingRename && profile && (
        <div
          className={clsx(
            personaliseStyles.managementActions,
            personaliseStyles.renameConfirm,
          )}
        >
          <span className={personaliseStyles.confirmText}>
            {getProfilePath(profile.handle)} will stop working straight away,
            and anyone can claim it.
          </span>
          <Button size="sm" onClick={onSubmit} disabled={saving}>
            Change it
          </Button>
          <Button variant="link" onClick={() => setConfirmingRename(false)}>
            Cancel
          </Button>
        </div>
      )}
      {message && (
        <p className={personaliseStyles.error} role="alert">
          {message}
        </p>
      )}
    </Step>
  );
}

/** A name and links as they'd be saved: what the preview shows. */
type Identity = { displayName?: string; links: ProfileLinks };

const LINK_FIELDS: Record<
  ProfileLinkId,
  { label: string; placeholder: string; help: string }
> = {
  [ProfileLinkId.Letterboxd]: {
    label: "Letterboxd",
    placeholder: "letterboxd.com/your-name",
    help: "Your username, or the address of your profile.",
  },
  [ProfileLinkId.Imdb]: {
    label: "IMDb",
    placeholder: "imdb.com/user/ur1234567",
    help: "The address of your profile, from IMDb's Your profile page.",
  },
  [ProfileLinkId.Website]: {
    label: "Website",
    placeholder: "example.com",
    help: "A site of your own: a blog, a newsletter. https only.",
  },
};

/** What each link's field holds to start: the saved value, as stored. */
function getLinkInputs(links: ProfileLinks = {}) {
  return Object.fromEntries(
    PROFILE_LINK_IDS.map((id) => [id, links[id] ?? ""]),
  ) as Record<ProfileLinkId, string>;
}

const sameLinks = (a: ProfileLinks, b: ProfileLinks = {}) =>
  PROFILE_LINK_IDS.every((id) => (a[id] ?? "") === (b[id] ?? ""));

/**
 * A name to show in place of the handle, and links to the reader's profiles
 * elsewhere, all optional and saved together. What a name can't hold is
 * dropped as it's typed rather than refused on saving: nobody needs telling
 * off for a quotation mark. A link is read from a username or a pasted
 * address, and one that can't be read says why under its field.
 */
function IdentityStep({
  profile,
  onSaved,
  onIdentityChange,
}: StepProps & { onIdentityChange: (identity: Identity) => void }) {
  const { save, saving, error } = useProfileSave(profile, onSaved);
  const [name, setName] = useState(profile?.displayName ?? "");
  const [linkInputs, setLinkInputs] = useState(() =>
    getLinkInputs(profile?.links),
  );

  const displayName = sanitiseDisplayName(name);
  const nameTooLong = getNameLength(displayName) > DISPLAY_NAME_MAX_LENGTH;
  const parsed = PROFILE_LINK_IDS.map(
    (id) => [id, parseLinkInput(id, linkInputs[id])] as const,
  );
  const links = Object.fromEntries(
    parsed.flatMap(([id, result]) =>
      "value" in result && result.value ? [[id, result.value]] : [],
    ),
  ) as ProfileLinks;
  const problems = parsed.some(([, result]) => "problem" in result);
  const changed =
    displayName !== (profile?.displayName ?? "") ||
    !sameLinks(links, profile?.links);
  const blockedBySections = Boolean(profile?.public && !profile.sections);

  useEffect(() => {
    onIdentityChange({ displayName: displayName || undefined, links });
    // `links` is rebuilt every render; its contents are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName, JSON.stringify(links), onIdentityChange]);

  const onSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (!profile || !changed || problems || nameTooLong || blockedBySections)
      return;
    const next: UserProfile = { ...profile, links };
    if (displayName) next.displayName = displayName;
    else delete next.displayName;
    save(next).then((saved) => saved && setName(displayName));
  };

  return (
    <Step number={2} title="About you">
      <p className={personaliseStyles.managementText}>
        Optional. A name heads your profile in place of your handle, which stays
        beside it, and links lead to you elsewhere.
      </p>
      <form className={styles.fields} onSubmit={onSubmit}>
        <div className={styles.field}>
          <label htmlFor="profile-name" className={styles.fieldLabel}>
            Name
          </label>
          <input
            id="profile-name"
            className={personaliseStyles.input}
            type="text"
            autoComplete="name"
            maxLength={DISPLAY_NAME_MAX_LENGTH * 2}
            aria-describedby="profile-name-help"
            aria-invalid={nameTooLong ? true : undefined}
            value={name}
            onChange={(event) =>
              setName(stripDisplayNameInput(event.target.value))
            }
            placeholder={profile?.handle ?? "Your name"}
          />
          <span id="profile-name-help" className={styles.fieldHelp}>
            {nameTooLong
              ? `At most ${DISPLAY_NAME_MAX_LENGTH} characters`
              : `Up to ${DISPLAY_NAME_MAX_LENGTH} characters. Quotation marks, <, >, & and \\ can't be used.`}
          </span>
        </div>
        {parsed.map(([id, result]) => (
          <div key={id} className={styles.field}>
            <label htmlFor={`profile-link-${id}`} className={styles.fieldLabel}>
              {LINK_FIELDS[id].label}
            </label>
            <input
              id={`profile-link-${id}`}
              className={personaliseStyles.input}
              type={id === ProfileLinkId.Website ? "url" : "text"}
              inputMode={id === ProfileLinkId.Website ? "url" : undefined}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-describedby={`profile-link-${id}-help`}
              aria-invalid={"problem" in result ? true : undefined}
              value={linkInputs[id]}
              onChange={(event) =>
                setLinkInputs((current) => ({
                  ...current,
                  [id]: event.target.value,
                }))
              }
              placeholder={LINK_FIELDS[id].placeholder}
            />
            <span
              id={`profile-link-${id}-help`}
              className={clsx(
                styles.fieldHelp,
                "problem" in result && styles.fieldProblem,
              )}
            >
              {"problem" in result ? result.problem : LINK_FIELDS[id].help}
            </span>
          </div>
        ))}
        <div className={personaliseStyles.managementActions}>
          <Button
            type="submit"
            size="sm"
            disabled={
              !profile ||
              saving ||
              !changed ||
              problems ||
              nameTooLong ||
              blockedBySections
            }
          >
            Save
          </Button>
          {!profile ? (
            <span className={personaliseStyles.confirmText}>
              Save a handle first.
            </span>
          ) : blockedBySections ? (
            <span className={personaliseStyles.confirmText}>
              Choose what your profile shows first, below.
            </span>
          ) : (
            !changed &&
            (profile.displayName || profile.links) && (
              <span className={personaliseStyles.confirmText}>Saved</span>
            )
          )}
        </div>
      </form>
      {error && (
        <p className={personaliseStyles.error} role="alert">
          {error}
        </p>
      )}
    </Step>
  );
}

/** What each switch is called, and what turning it on puts on the page. */
const SECTION_COPY: Record<
  ProfileSectionId,
  { label: string; description: string }
> = {
  [ProfileSectionId.SeenStats]: {
    label: "Seen stats",
    description:
      "How much you've seen, your longest, shortest, oldest and newest films, the directors, actors, genres, decades and languages you watch most, and how far you are through film lists.",
  },
  [ProfileSectionId.Watchlist]: {
    label: "Watchlist",
    description: "The films you want to see.",
  },
  [ProfileSectionId.FavouriteVenues]: {
    label: "Favourite venues",
    description:
      "The venues in My Venues. Between them, they can hint at where you live or work.",
  },
  [ProfileSectionId.Seen]: {
    label: "Seen list",
    description: "Every film you've marked as seen.",
  },
};

const sameSections = (a: ProfileSections, b: ProfileSections | undefined) =>
  b !== undefined && PROFILE_SECTION_IDS.every((id) => a[id] === b[id]);

/**
 * A switch per section, all on to start with, saved together. The first
 * save is what lets the profile go public.
 */
function SectionsStep({
  profile,
  onSaved,
  draft,
  onDraftChange,
}: StepProps & {
  draft: ProfileSections;
  onDraftChange: (sections: ProfileSections) => void;
}) {
  const { save, saving, error } = useProfileSave(profile, onSaved);
  const saved = profile?.sections;
  const unsaved = !sameSections(draft, saved);
  // The stats are worked out in the visitor's browser, from the Seen list.
  const statsSendSeen =
    draft[ProfileSectionId.SeenStats] && !draft[ProfileSectionId.Seen];

  return (
    <Step number={3} title="What it shows">
      <p className={personaliseStyles.managementText}>
        Everything starts switched on. Turn off anything you&apos;d rather keep
        to yourself; the preview below shows the page as visitors will see it.
      </p>
      <ul className={styles.sections}>
        {PROFILE_SECTION_IDS.map((id) => (
          <li key={id} className={styles.section}>
            <Switch
              id={`profile-section-${id}`}
              label={SECTION_COPY[id].label}
              checked={draft[id]}
              onChange={(checked) => onDraftChange({ ...draft, [id]: checked })}
              describedBy={`profile-section-${id}-help`}
              className={personaliseStyles.managementSwitch}
            />
            <p id={`profile-section-${id}-help`} className={styles.sectionHelp}>
              {SECTION_COPY[id].description}
              {id === ProfileSectionId.SeenStats && statsSendSeen && (
                <span className={styles.sectionCaveat}>
                  {" "}
                  Your stats are worked out in the visitor&apos;s browser, so
                  your Seen list is still sent with the page while it&apos;s
                  hidden. It isn&apos;t shown, but anyone reading the
                  page&apos;s source could find it.
                </span>
              )}
            </p>
          </li>
        ))}
      </ul>
      <div className={personaliseStyles.managementActions}>
        <Button
          size="sm"
          onClick={() => profile && save({ ...profile, sections: draft })}
          disabled={!profile || saving || !unsaved}
        >
          {saved ? "Save changes" : "Save what's shown"}
        </Button>
        {!profile ? (
          <span className={personaliseStyles.confirmText}>
            Save a handle first.
          </span>
        ) : unsaved && saved ? (
          <Button variant="link" onClick={() => onDraftChange(saved)}>
            Undo changes
          </Button>
        ) : (
          saved && <span className={personaliseStyles.confirmText}>Saved</span>
        )}
      </div>
      {error && (
        <p className={personaliseStyles.error} role="alert">
          {error}
        </p>
      )}
    </Step>
  );
}

/**
 * The switch, which can't be turned on until a handle and a choice of what's
 * shown are saved, and the current choice is the saved one: going public
 * publishes what's saved, so an unsaved change would mean the preview showed
 * something else. Turning it off never waits for anything.
 */
function VisibilityStep({
  profile,
  onSaved,
  draft,
}: StepProps & { draft: ProfileSections }) {
  const { save, saving, error } = useProfileSave(profile, onSaved);
  const isPublic = profile?.public ?? false;
  const waitingFor = !profile
    ? "Save a handle first."
    : !profile.sections
      ? "Choose what your profile shows and save it first."
      : !sameSections(draft, profile.sections)
        ? "Save your changes to what it shows first."
        : null;

  return (
    <Step number={4} title="Who can see it">
      <Switch
        id="profile-public"
        label="Public"
        checked={isPublic}
        disabled={saving || (!isPublic && waitingFor !== null)}
        describedBy="profile-public-help"
        onChange={(checked) => profile && save({ ...profile, public: checked })}
        className={personaliseStyles.managementSwitch}
      />
      <p id="profile-public-help" className={personaliseStyles.managementText}>
        {!isPublic && waitingFor
          ? waitingFor
          : isPublic
            ? `Anyone with the link can see what your profile shows at clusterflick.com${getProfilePath(profile!.handle)}, and search engines may list it.`
            : "While this is off, only you can open your profile."}
      </p>
      {profile && (
        // An anchor, not a client-side link: the page is the profiles
        // Worker's, and isn't in the static export.
        <ButtonAnchor
          href={getProfilePath(profile.handle)}
          variant="secondary"
          size="sm"
        >
          View your profile
        </ButtonAnchor>
      )}
      {error && (
        <p className={personaliseStyles.error} role="alert">
          {error}
        </p>
      )}
    </Step>
  );
}

/**
 * The page as visitors will see it with the choice as it stands: the profile
 * page's own sections, given the reader's own lists. Their film details are
 * read once, as the stats on /personalise read them.
 */
function Preview({
  handle,
  identity,
  sections,
  venueImagePaths,
  movieLists,
}: {
  /** Undefined before one is saved. */
  handle?: string;
  identity: Identity;
  sections: ProfileSections;
} & BuildData) {
  const { lists, favouriteVenues, readFilmDetails } = useUserContext();
  const [filmDetails, setFilmDetails] = useState<FilmDetailsData | null>(null);

  useEffect(() => {
    let cancelled = false;
    readFilmDetails().then(
      (details) => !cancelled && setFilmDetails(details),
      (error) => {
        console.error("Failed to load film details", error);
        // The stats then say there's nothing to count, as they would on the
        // page for a reader with no details.
        if (!cancelled) setFilmDetails({ films: {}, people: {} });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [readFilmDetails]);

  if (!lists || !filmDetails) {
    return <LoadingIndicator message="Loading the preview…" />;
  }

  const nothingShown = PROFILE_SECTION_IDS.every((id) => !sections[id]);
  // The stats' records name films, so with the list hidden they still give a
  // few away: said only when there are enough films for the stats to show.
  const statsNameFilms =
    sections[ProfileSectionId.SeenStats] &&
    !sections[ProfileSectionId.Seen] &&
    Object.keys(lists[UserListId.Seen]).length >= MIN_STATS_FILMS;
  const { title, subtitle } = getProfileHeading({
    handle: handle ?? "your-handle",
    displayName: identity.displayName,
    sections,
    lists,
  });

  return (
    <section className={styles.preview} aria-labelledby="profile-preview">
      <div className={styles.previewHeader}>
        <p id="profile-preview" className={styles.previewLabel}>
          Preview
        </p>
        <h2 className={styles.previewTitle}>{title}</h2>
        {subtitle && <p className={styles.previewText}>{subtitle}</p>}
        <ProfileLinksRow links={identity.links} />
        {(nothingShown || statsNameFilms) && (
          <p className={styles.previewNote}>
            {nothingShown
              ? "With every section switched off, your profile shows only this."
              : "The Seen list is hidden, but the stats still name a few films."}
          </p>
        )}
      </div>
      {!nothingShown && (
        <ProfileView
          sections={sections}
          lists={lists}
          favouriteVenues={favouriteVenues ?? {}}
          filmDetails={filmDetails}
          venueImagePaths={venueImagePaths}
          movieLists={movieLists}
        />
      )}
    </section>
  );
}
