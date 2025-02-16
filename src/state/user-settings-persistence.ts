import type { FavouriteMovie } from "@/types";
import { Octokit } from "octokit";
import { safelyJsonParse, safelyJsonStringify } from "@/utils/json-handling";

const authKey = "auth-token";
const gistIdKey = "gist-id";
const stateKey = "user-settings";
const expectedFile = "clusterflick-user-settings.json";

type UserSettings = {
  favouriteMovies: FavouriteMovie[];
};

const stringifyUserSettings = (userSettings: UserSettings): string =>
  safelyJsonStringify(userSettings) ?? "{}";

const parseUserSettings = (userSettings: string | undefined): UserSettings =>
  safelyJsonParse(userSettings ?? "{}") as UserSettings;

export const getAuthToken = () => localStorage.getItem(authKey);

export const setAuthToken = (token: string) =>
  localStorage.setItem(authKey, token);

export const removeAuthToken = () => localStorage.removeItem(authKey);

export const getGithubGistId = () => localStorage.getItem(gistIdKey);

export const setGithubGistId = (gistId: string) =>
  localStorage.setItem(gistIdKey, gistId);

export const removeGithubGistId = () => localStorage.removeItem(gistIdKey);

export async function setPersistedUserSettings(userSettings: UserSettings) {
  const userSettingsValue = stringifyUserSettings(userSettings);
  localStorage.setItem(stateKey, userSettingsValue);

  const gistId = getGithubGistId();
  const authToken = getAuthToken();

  if (gistId && authToken) {
    const octokit = new Octokit({ auth: authToken });
    await octokit.rest.gists.update({
      gist_id: gistId,
      files: {
        [expectedFile]: {
          content: userSettingsValue,
        },
      },
    });
  }
}

async function updateEverything(
  octokit: Octokit,
  gistId: string,
  updateState: (userSettings: UserSettings) => void,
) {
  const gist = await octokit.rest.gists.get({ gist_id: gistId });
  const state = parseUserSettings(gist.data.files?.[expectedFile]?.content);
  const userSettingsValue = stringifyUserSettings(state);
  localStorage.setItem(stateKey, userSettingsValue);
  setGithubGistId(gistId);
  updateState(state);
}

async function integrateWithGist(
  auth: string,
  userSettings: UserSettings,
  updateState: (userSettings: UserSettings) => void,
  onComplete?: () => void,
) {
  const octokit = new Octokit({ auth });

  const gistId = getGithubGistId();
  if (gistId) {
    await updateEverything(octokit, gistId, updateState);
  } else {
    const gistList = await octokit.rest.gists.list();
    // TODO: Does the find need to paginate if there are many gists?
    const gistMatch = gistList.data.find(({ files }) => !!files[expectedFile]);

    if (gistMatch) {
      await updateEverything(octokit, gistMatch.id, updateState);
    } else {
      const gist = await octokit.rest.gists.create({
        description: "User settings for Clusterflick",
        public: false,
        files: {
          [expectedFile]: {
            content: stringifyUserSettings(userSettings),
          },
        },
      });
      if (gist.data.id) setGithubGistId(gist.data.id);
    }
  }
  if (onComplete) onComplete();
}

export function syncWithPersistedUserSettings(
  updateState: (userSettings: UserSettings) => void,
  onComplete?: () => void,
) {
  const userSettingsValue = localStorage.getItem(stateKey) || undefined;
  const userSettings = parseUserSettings(userSettingsValue);

  // Return initial data pulled from local storage until we can sync
  updateState(userSettings);

  // If we have an auth token, integrate with gist storage in the background
  const authToken = getAuthToken();
  if (authToken) {
    integrateWithGist(authToken, userSettings, updateState, onComplete);
  } else {
    if (onComplete) onComplete();
  }
}
