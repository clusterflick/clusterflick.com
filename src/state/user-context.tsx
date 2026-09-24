"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import type { User } from "firebase/auth";
import type { Movie } from "@/types";
import {
  isFirebaseConfigured,
  loadFirebase,
  type FirebaseServices,
} from "@/lib/firebase";
import {
  addToUserList,
  deleteUserLists,
  fetchUserLists,
  removeFromUserList,
  toUserListEntry,
  type UserListId,
  type UserLists,
} from "@/lib/user-lists";

/**
 * - `unavailable` — this build has no Firebase config; personalisation is off.
 * - `checking` — not yet known. The first render, server and client alike.
 * - `signed-out` / `signed-in` — known.
 */
export type UserStatus =
  | "unavailable"
  | "checking"
  | "signed-out"
  | "signed-in";

export type UserContextType = {
  status: UserStatus;
  email: string | null;
  /** Null until fetched after sign-in, and whenever signed out. */
  lists: UserLists | null;
  /** Emails a sign-in link. Signing up and signing in are the same action. */
  sendSignInLink: (email: string) => Promise<void>;
  /**
   * Completes sign-in from a link in the current URL. Resolves `needs-email`
   * when the link was opened somewhere the address wasn't remembered — another
   * browser or device — so the caller must ask for it and call again.
   */
  completeSignIn: (email?: string) => Promise<"done" | "needs-email">;
  signOut: () => Promise<void>;
  /** Deletes the user's lists and then their account. */
  deleteAccount: () => Promise<void>;
  addToList: (
    listId: UserListId,
    movie: Pick<Movie, "id" | "title" | "year" | "posterPath">,
  ) => Promise<void>;
  removeFromList: (listId: UserListId, movieId: Movie["id"]) => Promise<void>;
};

/**
 * Set on sign-in, cleared on sign-out. Carries no personal data: it exists so
 * a visitor who has never signed in never downloads the SDK just to be told
 * so. If it outlives the session, the SDK loads, reports nobody, and clears it.
 */
const SIGNED_IN_FLAG_KEY = "clusterflick-signed-in";

/**
 * The address a link was sent to, needed again to redeem it — the link itself
 * deliberately doesn't carry it. Must be localStorage, not sessionStorage: the
 * link opens in a new tab. Deleted as soon as it's used, and ignored after an
 * hour so an abandoned attempt doesn't leave an address behind indefinitely.
 */
const PENDING_EMAIL_KEY = "clusterflick-sign-in-email";
const PENDING_EMAIL_MAX_AGE_MS = 60 * 60 * 1000;

/** Error code Firebase gives when deleting an account needs a fresh sign-in. */
export const REQUIRES_RECENT_LOGIN = "auth/requires-recent-login";

// Storage can throw (private windows, blocked site data); none of it is
// essential, so every access degrades to "not stored".
function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function storageRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

function readPendingEmail(): string | null {
  const raw = storageGet(PENDING_EMAIL_KEY);
  if (!raw) return null;
  try {
    const { email, sentAt } = JSON.parse(raw);
    if (Date.now() - sentAt <= PENDING_EMAIL_MAX_AGE_MS) return email;
  } catch {}
  storageRemove(PENDING_EMAIL_KEY);
  return null;
}

function getSignInReturnUrl() {
  return `${window.location.origin}/personalise/`;
}

const Context = createContext<UserContextType | undefined>(undefined);

/**
 * Provider for the signed-in user and their lists. Loads Firebase only for
 * visitors who have signed in before, or who are signing in now.
 */
export function UserProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<UserStatus>(
    isFirebaseConfigured ? "checking" : "unavailable",
  );
  const [user, setUser] = useState<User | null>(null);
  const [lists, setLists] = useState<UserLists | null>(null);
  const servicesRef = useRef<FirebaseServices | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  /** Load the SDK once and start following the auth state. */
  const getServices = useCallback(async () => {
    if (servicesRef.current) return servicesRef.current;
    const services = await loadFirebase();
    if (!servicesRef.current) {
      servicesRef.current = services;
      const { onAuthStateChanged } = await import("firebase/auth");
      unsubscribeRef.current = onAuthStateChanged(services.auth, (nextUser) => {
        setUser(nextUser);
        setStatus(nextUser ? "signed-in" : "signed-out");
        if (nextUser) {
          storageSet(SIGNED_IN_FLAG_KEY, "1");
        } else {
          storageRemove(SIGNED_IN_FLAG_KEY);
          setLists(null);
        }
      });
    }
    return servicesRef.current;
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    if (storageGet(SIGNED_IN_FLAG_KEY)) {
      getServices().catch(() => setStatus("signed-out"));
    } else {
      setStatus("signed-out");
    }
    return () => unsubscribeRef.current?.();
  }, [getServices]);

  useEffect(() => {
    if (!user || !servicesRef.current) return;
    let cancelled = false;
    fetchUserLists(servicesRef.current.db, user.uid).then(
      (fetched) => !cancelled && setLists(fetched),
      (error) => console.error("Failed to load lists", error),
    );
    return () => {
      cancelled = true;
    };
  }, [user]);

  const sendSignInLink = useCallback(
    async (email: string) => {
      const { auth } = await getServices();
      const { sendSignInLinkToEmail } = await import("firebase/auth");
      await sendSignInLinkToEmail(auth, email, {
        url: getSignInReturnUrl(),
        handleCodeInApp: true,
      });
      storageSet(
        PENDING_EMAIL_KEY,
        JSON.stringify({ email, sentAt: Date.now() }),
      );
    },
    [getServices],
  );

  const completeSignIn = useCallback(
    async (email?: string) => {
      const address = email ?? readPendingEmail();
      if (!address) return "needs-email" as const;
      const { auth } = await getServices();
      const { signInWithEmailLink } = await import("firebase/auth");
      await signInWithEmailLink(auth, address, window.location.href);
      storageRemove(PENDING_EMAIL_KEY);
      return "done" as const;
    },
    [getServices],
  );

  const signOut = useCallback(async () => {
    const { auth } = await getServices();
    await auth.signOut();
  }, [getServices]);

  const deleteAccount = useCallback(async () => {
    const { auth, db } = await getServices();
    const current = auth.currentUser;
    if (!current) return;
    // Data first: once the account is gone, the rules no longer let anyone
    // delete its document. If the account deletion then needs a fresh sign-in,
    // the lists are already gone and the caller asks for one.
    await deleteUserLists(db, current.uid);
    setLists(null);
    await current.delete();
  }, [getServices]);

  const addToList = useCallback<UserContextType["addToList"]>(
    async (listId, movie) => {
      const { db } = await getServices();
      if (!user) throw new Error("Not signed in");
      const entry = toUserListEntry(movie);
      const previous = lists;
      setLists((current) =>
        current
          ? {
              ...current,
              [listId]: { ...current[listId], [movie.id]: entry },
            }
          : current,
      );
      try {
        await addToUserList(db, user.uid, listId, movie.id, entry);
      } catch (error) {
        setLists(previous);
        throw error;
      }
    },
    [getServices, user, lists],
  );

  const removeFromList = useCallback<UserContextType["removeFromList"]>(
    async (listId, movieId) => {
      const { db } = await getServices();
      if (!user) throw new Error("Not signed in");
      const previous = lists;
      setLists((current) => {
        if (!current) return current;
        const rest = { ...current[listId] };
        delete rest[movieId];
        return { ...current, [listId]: rest };
      });
      try {
        await removeFromUserList(db, user.uid, listId, movieId);
      } catch (error) {
        setLists(previous);
        throw error;
      }
    },
    [getServices, user, lists],
  );

  const contextValue = useMemo<UserContextType>(
    () => ({
      status,
      email: user?.email ?? null,
      lists,
      sendSignInLink,
      completeSignIn,
      signOut,
      deleteAccount,
      addToList,
      removeFromList,
    }),
    [
      status,
      user,
      lists,
      sendSignInLink,
      completeSignIn,
      signOut,
      deleteAccount,
      addToList,
      removeFromList,
    ],
  );

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
}

/**
 * Supplies a fixed context value, for Storybook stories of components that
 * read the user without touching Firebase.
 */
export function MockUserProvider({
  value,
  children,
}: {
  value: Partial<UserContextType>;
  children: ReactNode;
}) {
  const noop = async () => {};
  const full: UserContextType = {
    status: "signed-out",
    email: null,
    lists: null,
    sendSignInLink: noop,
    completeSignIn: async () => "done",
    signOut: noop,
    deleteAccount: noop,
    addToList: noop,
    removeFromList: noop,
    ...value,
  };
  return <Context.Provider value={full}>{children}</Context.Provider>;
}

export function useUserContext() {
  const context = useContext(Context);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
}
