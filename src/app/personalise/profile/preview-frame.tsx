"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ViewWindowProvider } from "@/state/view-window-context";

/**
 * An empty document of the page's own origin. Links in it leave the preview
 * for the whole tab, as they would on the page, rather than opening inside
 * the frame.
 */
const FRAME_DOCUMENT =
  '<!doctype html><html><head><base target="_top"></head><body></body></html>';

const isStylesheet = (node: Node): node is HTMLElement =>
  node instanceof HTMLStyleElement ||
  (node instanceof HTMLLinkElement && node.rel === "stylesheet");

/**
 * Draws its children into an iframe, so that what's inside is laid out at the
 * frame's width: its media queries, and `useMediaQuery` through
 * `ViewWindowProvider`, answer for the frame rather than the screen. The
 * profile preview needs it, being about 750px of a wide screen: drawn in the
 * page itself, the profile took its desktop layout and was cramped.
 *
 * The children are still this page's React tree, rendered through a portal,
 * so they keep its state and context (the reader's lists, the listings) with
 * nothing passed across. Only the styles have to be carried over: the page's
 * stylesheets are copied into the frame, and kept in step as the page adds
 * and removes them (CSS for code loaded later, and in development every
 * edit), along with the classes on `<html>` and `<body>` that carry the
 * fonts.
 */
export default function PreviewFrame({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [view, setView] = useState<{ body: HTMLElement; win: Window } | null>(
    null,
  );

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let observer: MutationObserver | undefined;

    const setUp = () => {
      const frameDocument = frame.contentDocument;
      const frameWindow = frame.contentWindow;
      if (!frameDocument?.body || !frameWindow) return;
      observer?.disconnect();

      // The fonts' variables are on these, as classes on the site and as
      // inline custom properties in Storybook.
      const root = frameDocument.documentElement;
      root.className = document.documentElement.className;
      root.lang = document.documentElement.lang;
      root.setAttribute(
        "style",
        document.documentElement.getAttribute("style") ?? "",
      );
      frameDocument.body.className = document.body.className;
      // Scrolling to the end of the preview doesn't carry on into the page.
      root.style.overscrollBehavior = "contain";

      // Each of the page's stylesheets and its copy in the frame.
      const copies = new Map<Node, HTMLElement>();
      const copy = (node: Node) => {
        if (!isStylesheet(node) || copies.has(node)) return;
        const clone = node.cloneNode(true) as HTMLElement;
        copies.set(node, clone);
        frameDocument.head.appendChild(clone);
      };
      document.head
        .querySelectorAll('style, link[rel="stylesheet"]')
        .forEach(copy);

      observer = new MutationObserver((records) => {
        for (const record of records) {
          record.addedNodes.forEach(copy);
          record.removedNodes.forEach((node) => {
            copies.get(node)?.remove();
            copies.delete(node);
          });
          // A style element whose text changed (development's hot reload).
          const target =
            record.type === "characterData"
              ? record.target.parentNode
              : record.target;
          if (target instanceof HTMLStyleElement && copies.has(target)) {
            copies.get(target)!.textContent = target.textContent;
          }
        }
      });
      observer.observe(document.head, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      setView({ body: frameDocument.body, win: frameWindow });
    };

    // `srcDoc` loads asynchronously: until then the frame holds an empty
    // placeholder document, which is replaced.
    frame.addEventListener("load", setUp);
    if (
      frame.contentDocument?.readyState === "complete" &&
      frame.contentDocument.URL === "about:srcdoc"
    ) {
      setUp();
    }
    return () => {
      frame.removeEventListener("load", setUp);
      observer?.disconnect();
    };
  }, []);

  return (
    <>
      <iframe
        ref={frameRef}
        title={title}
        className={className}
        srcDoc={FRAME_DOCUMENT}
      />
      {view &&
        createPortal(
          <ViewWindowProvider value={view.win}>{children}</ViewWindowProvider>,
          view.body,
        )}
    </>
  );
}
