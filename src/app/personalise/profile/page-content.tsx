"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { ButtonLink } from "@/components/button";
import EmptyState from "@/components/empty-state";
import LoadingIndicator from "@/components/loading-indicator";
import StandardPageLayout from "@/components/standard-page-layout";
import Switch from "@/components/switch";
import { useUserContext } from "@/state/user-context";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  DISPLAY_NAME_MAX_LENGTH,
  PROFILE_LINK_IDS,
  PROFILE_SECTION_IDS,
  ProfileLinkId,
  ProfileSectionId,
  stripDisplayNameInput,
  type UserProfile,
} from "@/lib/user-profile";
import {
  getProfileDraft,
  isDraftChanged,
  readDraft,
  type ProfileDraft,
} from "@/lib/user-profile/draft";
import type { MovieListProgressItem } from "@/app/personalise/seen-stats";
import {
  ProfileWithdrawnNotice,
  useProfileSave,
  usePublicProfile,
  type PublicProfileState,
} from "@/app/personalise/public-profile";
import personaliseStyles from "@/app/personalise/page.module.css";
import SettingsCard from "./settings-card";
import HandleField from "./handle-field";
import FavouritesPicker from "./favourites-picker";
import PublishCard, { SECTION_NAMES } from "./publish-card";
import SaveBar from "./save-bar";
import { useHandleAvailability } from "./use-handle-availability";
import { PreviewDialog, ProfilePreview } from "./profile-preview";
import PreviewFrame from "./preview-frame";
import styles from "./page.module.css";

const PERSONALISE_PATH = "/personalise/";

type BuildData = {
  venueImagePaths: Record<string, string>;
  movieLists: MovieListProgressItem[];
};

/**
 * Where a reader with the `publicProfile` capability sets up and edits their
 * profile: where it stands and the way to publish it, then the address, the
 * name and links, the favourite films and what it shows, all one draft
 * saved with one button, and beside them, where there's room, the profile as
 * visitors will see it.
 */
export default function ProfileSettingsPageContent(build: BuildData) {
  const { status } = useUserContext();
  const state = usePublicProfile();
  const signedIn = status === "signed-in";

  return (
    <StandardPageLayout
      title="Your Public Profile"
      subtitle="Share your films at an address of your own, showing as much or as little as you like."
      afterContent={
        signedIn && state?.granted ? (
          <Editor state={state} {...build} />
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
      ) : null}
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

const LINK_FIELDS: Record<
  ProfileLinkId,
  { label: string; placeholder: string }
> = {
  [ProfileLinkId.Letterboxd]: {
    label: "Letterboxd",
    placeholder: "letterboxd.com/your-name",
  },
  [ProfileLinkId.Imdb]: {
    label: "IMDb",
    placeholder: "imdb.com/user/ur1234567",
  },
  [ProfileLinkId.Website]: {
    label: "Website",
    placeholder: "example.com",
  },
};

const SECTION_DESCRIPTIONS: Record<ProfileSectionId, string> = {
  [ProfileSectionId.SeenStats]:
    "How much you've seen, your longest, shortest, oldest and newest films, the directors, actors, genres, decades and languages you watch most, and how far you are through film lists.",
  [ProfileSectionId.Watchlist]:
    "The films you want to see, and which of them are showing this week.",
  [ProfileSectionId.FavouriteVenues]:
    "The venues in My Venues. Between them, they can hint at where you live or work.",
  [ProfileSectionId.Seen]: "Every film you've marked as seen.",
};

/**
 * The settings as one draft. Everything typed or picked changes the draft,
 * the preview follows it, and Save writes all of it at once, a new handle
 * included: nothing has to be saved before anything else can be. Leaving
 * with changes unsaved asks first.
 */
function Editor({
  state,
  venueImagePaths,
  movieLists,
}: { state: PublicProfileState } & BuildData) {
  const { profile, onSaved } = state;
  const { isHandleTaken } = useUserContext();
  const { save, saving, setSaving, error, setError } = useProfileSave(
    profile,
    onSaved,
  );
  const [draft, setDraft] = useState<ProfileDraft>(() =>
    getProfileDraft(profile),
  );
  const [confirmingRename, setConfirmingRename] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  // Which control the last write came from, so its error shows there.
  const [lastAction, setLastAction] = useState<"save" | "publish">("save");
  // Matches `.editor`'s breakpoint in page.module.css. Narrower, the preview
  // is a dialog opened from the save bar, and isn't drawn until it's opened.
  const wide = useMediaQuery("(min-width: 1100px)");

  const read = readDraft(draft);
  const { value, problems } = read;
  const changed = isDraftChanged(value, profile);
  const availability = useHandleAvailability(
    value.handle,
    profile?.handle,
    !problems.handle,
  );
  const handleTaken = availability === "taken";
  const canSave = read.valid && !handleTaken;
  const renaming = Boolean(profile && value.handle !== profile.handle);
  const blocker = problems.handle
    ? "Choose an address to save"
    : handleTaken
      ? "That address is taken"
      : !read.valid
        ? "Some fields need another look"
        : undefined;

  const update = (change: Partial<ProfileDraft>) => {
    setDraft((current) => ({ ...current, ...change }));
    setConfirmingRename(false);
    setError(null);
  };

  // Leaving with changes unsaved asks first; the browser words it.
  useEffect(() => {
    if (!changed) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [changed]);

  /**
   * Writes the draft, `public` as given. A new handle is checked once more
   * first, since another reader can claim it after the check as it was
   * typed. Afterwards the draft is what was saved, as it would read back.
   */
  const write = async (isPublic: boolean) => {
    if (!canSave) return false;
    if (value.handle !== profile?.handle) {
      setSaving(true);
      try {
        if (await isHandleTaken(value.handle)) {
          setError("That address was just taken. Try another.");
          return false;
        }
      } catch (checkError) {
        console.error("Failed to check handle", checkError);
        setError("Something went wrong saving that. Please try again.");
        return false;
      } finally {
        setSaving(false);
      }
    }
    const next: UserProfile = { ...value, public: isPublic };
    const saved = await save(next);
    if (saved) {
      setDraft(getProfileDraft(next));
      setConfirmingRename(false);
    }
    return saved;
  };

  const onSave = () => {
    setLastAction("save");
    // Renaming frees the old address at once, so it asks first.
    if (renaming && !confirmingRename) {
      setConfirmingRename(true);
      return;
    }
    write(profile?.public ?? false);
  };

  // Taking it down changes nothing else, and never waits for the draft.
  const onUnpublish = async () =>
    profile ? save({ ...profile, public: false }) : false;

  const preview = (
    <ProfilePreview
      profile={{
        handle: problems.handle
          ? (profile?.handle ?? "your-handle")
          : value.handle,
        displayName: value.displayName,
        links: value.links ?? {},
        favourites: draft.favourites,
        sections: draft.sections,
      }}
      venueImagePaths={venueImagePaths}
      movieLists={movieLists}
    />
  );

  return (
    <div className={styles.editor}>
      <div className={styles.settings}>
        {profile?.public && !profile.sections && (
          <aside className={personaliseStyles.profileNotice}>
            <p className={personaliseStyles.profileNoticeText}>
              Your profile went public before you could choose what it shows, so
              it shows everything. Have a look below, and save what you want on
              it.
            </p>
          </aside>
        )}

        <PublishCard
          profile={profile}
          draftSections={draft.sections}
          hasFavourites={draft.favourites.length > 0}
          canPublish={canSave}
          publishBlocker={blocker}
          renameFrom={renaming ? profile?.handle : undefined}
          saving={saving}
          error={lastAction === "publish" ? error : null}
          onPublish={() => {
            setLastAction("publish");
            return write(true);
          }}
          onUnpublish={() => {
            setLastAction("publish");
            return onUnpublish();
          }}
        />

        <SettingsCard title="Address">
          <HandleField
            value={draft.handle}
            onChange={(handle) => update({ handle })}
            handle={value.handle}
            problem={problems.handle}
            availability={availability}
          />
        </SettingsCard>

        <SettingsCard
          title="About you"
          intro="Optional. A name heads your profile in place of your handle, which stays beside it, and links lead to you elsewhere."
        >
          <div className={styles.fields}>
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
                aria-describedby={
                  problems.name ? "profile-name-help" : undefined
                }
                aria-invalid={problems.name ? true : undefined}
                value={draft.name}
                onChange={(event) =>
                  update({ name: stripDisplayNameInput(event.target.value) })
                }
                placeholder={value.handle || "Your name"}
              />
              {problems.name && (
                <span
                  id="profile-name-help"
                  className={clsx(styles.fieldHelp, styles.fieldProblem)}
                >
                  {problems.name}
                </span>
              )}
            </div>
            {PROFILE_LINK_IDS.map((id) => (
              <div key={id} className={styles.field}>
                <label
                  htmlFor={`profile-link-${id}`}
                  className={styles.fieldLabel}
                >
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
                  aria-describedby={
                    problems.links[id] ? `profile-link-${id}-help` : undefined
                  }
                  aria-invalid={problems.links[id] ? true : undefined}
                  value={draft.links[id]}
                  onChange={(event) =>
                    update({
                      links: { ...draft.links, [id]: event.target.value },
                    })
                  }
                  placeholder={LINK_FIELDS[id].placeholder}
                />
                {problems.links[id] && (
                  <span
                    id={`profile-link-${id}-help`}
                    className={clsx(styles.fieldHelp, styles.fieldProblem)}
                  >
                    {problems.links[id]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard
          title="Favourite films"
          intro="Optional. Up to four films to head your profile, in your order. Pick from what you've seen, or search every film."
        >
          <FavouritesPicker
            value={draft.favourites}
            onChange={(favourites) => update({ favourites })}
          />
        </SettingsCard>

        <SettingsCard
          title="What it shows"
          intro="Everything starts switched on. Turn off anything you'd rather keep to yourself."
        >
          <ul className={styles.sections}>
            {PROFILE_SECTION_IDS.map((id) => (
              <li key={id} className={styles.section}>
                <Switch
                  id={`profile-section-${id}`}
                  label={SECTION_NAMES[id]}
                  checked={draft.sections[id]}
                  onChange={(checked) =>
                    update({ sections: { ...draft.sections, [id]: checked } })
                  }
                  describedBy={`profile-section-${id}-help`}
                  className={personaliseStyles.managementSwitch}
                />
                <p
                  id={`profile-section-${id}-help`}
                  className={styles.sectionHelp}
                >
                  {SECTION_DESCRIPTIONS[id]}
                </p>
              </li>
            ))}
          </ul>
          {draft.sections[ProfileSectionId.SeenStats] &&
            !draft.sections[ProfileSectionId.Seen] && (
              <p className={styles.sectionCaveat}>
                Your stats are worked out in the visitor&apos;s browser, so your
                Seen list is still sent with the page while it&apos;s hidden. It
                isn&apos;t shown, but anyone reading the page&apos;s source
                could find it.
              </p>
            )}
        </SettingsCard>

        <SaveBar
          changed={changed}
          canSave={canSave}
          blocker={blocker}
          saving={saving}
          error={lastAction === "save" ? error : null}
          confirmingRename={confirmingRename}
          renameFrom={profile?.handle}
          onSave={onSave}
          onDiscard={
            profile
              ? () => {
                  setDraft(getProfileDraft(profile));
                  setConfirmingRename(false);
                  setError(null);
                }
              : undefined
          }
          onCancelRename={() => setConfirmingRename(false)}
          onPreview={wide ? undefined : () => setPreviewOpen(true)}
        />
      </div>

      {wide && (
        <aside className={styles.previewColumn} aria-label="Preview">
          <p className={styles.previewLabel}>Preview · as visitors see it</p>
          <PreviewFrame
            title="Your profile, as visitors see it"
            className={styles.previewFrame}
          >
            {preview}
          </PreviewFrame>
        </aside>
      )}

      {previewOpen && !wide && (
        <PreviewDialog onClose={() => setPreviewOpen(false)}>
          {preview}
        </PreviewDialog>
      )}
    </div>
  );
}
