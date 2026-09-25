import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore/lite";

/**
 * Firebase web config. None of these values are secret — they identify the
 * project to the browser SDK, and it's the Firestore security rules and the
 * authorised-domains list that do the protecting. Each reference has to be a
 * literal `process.env.NEXT_PUBLIC_*` for Next.js to inline it at build time.
 */
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Personalisation switches itself off when the build carries no Firebase
 * config, so local builds, Storybook and Chromatic work without a project.
 */
export const isFirebaseConfigured = Object.values(config).every(Boolean);

export type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
};

let loading: Promise<FirebaseServices> | undefined;

/**
 * Load and initialise the SDK on first call. Dynamically imported because it
 * is large and the vast majority of visitors never sign in — they should pay
 * nothing for it.
 */
export function loadFirebase(): Promise<FirebaseServices> {
  if (!isFirebaseConfigured) {
    return Promise.reject(new Error("Firebase is not configured"));
  }

  loading ??= (async () => {
    const [{ initializeApp }, authModule, { getFirestore }] = await Promise.all(
      [
        import("firebase/app"),
        import("firebase/auth"),
        import("firebase/firestore/lite"),
      ],
    );
    const app = initializeApp(config);
    // initializeAuth rather than getAuth: getAuth bundles the popup/redirect
    // resolver, which email-link sign-in never uses.
    const auth = authModule.initializeAuth(app, {
      persistence: [
        authModule.indexedDBLocalPersistence,
        authModule.browserLocalPersistence,
      ],
    });
    return { app, auth, db: getFirestore(app) };
  })();

  // A failed load (offline, say) shouldn't poison every later attempt.
  loading.catch(() => {
    loading = undefined;
  });

  return loading;
}
