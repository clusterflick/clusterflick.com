"use client";

import { createContext } from "react";

/**
 * The window a subtree is drawn in, where that isn't the page's own: the
 * profile preview draws the profile into an iframe, so its media queries
 * measure the preview's width rather than the screen's. CSS gets that from
 * the iframe for free; this is how script that asks a window the same
 * questions (`useMediaQuery`) asks the right one.
 *
 * Null, the default, means the page's own window.
 */
export const ViewWindowContext = createContext<Window | null>(null);

export const ViewWindowProvider = ViewWindowContext.Provider;
