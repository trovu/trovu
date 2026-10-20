/** @module TargetOpener */

/**
 * Decides how a target URL has to be opened.
 *
 * When trovu runs as an installed PWA (standalone display mode), navigating the app
 * window to a URL outside the app scope keeps the user inside the app instead of
 * handing the URL to the operating system, so the target is rendered by the PWA and
 * never reaches the default browser or the app that is registered for the URL.
 * Deciding in one place makes that behaviour testable without a real installed PWA.
 */
export type TargetOpenAction =
  | { type: "none" }
  | { type: "navigate"; url: string }
  | { type: "external"; url: string };

export interface TargetOpenOptions {
  /** True when the page runs in an installed PWA (standalone display mode). */
  isStandalone: boolean;
  /** The origin of the app itself, e.g. https://trovu.net */
  appOrigin: string;
}

export interface TargetOpenEnvironment extends TargetOpenOptions {
  /** Opens the URL in the current window. Defaults to assigning window.location.href. */
  navigate?: (url: string) => void;
  /** Hands the URL to the operating system. Defaults to the window.open web_target call. */
  openExternal?: (url: string) => void;
}

/**
 * Whether the URL points outside of the app itself.
 *
 * A relative URL is resolved against the app origin and therefore stays in scope.
 * An URL that cannot be parsed is treated as in scope, so that the behaviour for
 * such input is the same as before.
 */
export function isOutOfScope(url: string, appOrigin: string): boolean {
  try {
    return new URL(url, appOrigin).origin !== appOrigin;
  } catch {
    return false;
  }
}

/**
 * Decides how a target URL should be opened.
 *
 * - no URL at all: nothing happens
 * - not running as an installed PWA: navigate in the current window, which is the
 *   browser tab itself
 * - installed PWA and the URL is inside the app scope: navigate in the current
 *   window, so the app keeps the user
 * - installed PWA and the URL is outside the app scope: hand the URL to the
 *   operating system, which opens it in the default browser or in the matching app
 */
export function decideTargetOpen(
  url: string | undefined | null,
  options: TargetOpenOptions,
): TargetOpenAction {
  if (!url) {
    return { type: "none" };
  }
  if (!options.isStandalone) {
    return { type: "navigate", url };
  }
  if (!isOutOfScope(url, options.appOrigin)) {
    return { type: "navigate", url };
  }
  return { type: "external", url };
}

  /**
   * Opens a target URL according to decideTargetOpen().
   *
   * The "external" handoff uses a link with target="_blank", which is the way an installed PWA
   * hands a URL to the operating system: the device decides whether the URL opens in the default
   * browser or in the app that is registered for it. Navigating the app window instead
   * (window.location.href) keeps the target inside the PWA, which is the behaviour this change
   * is about.
   */
  export function openTargetUrl(
    url: string | undefined | null,
    environment: TargetOpenEnvironment,
  ): TargetOpenAction {
    const action = decideTargetOpen(url, environment);
    if (action.type === "navigate") {
      const navigate =
        environment.navigate ?? ((target: string) => { window.location.href = target; });
      navigate(action.url);
    } else if (action.type === "external") {
      const openExternal =
        environment.openExternal ?? ((target: string) => { openExternalLink(target); });
      openExternal(action.url);
    }
    return action;
  }

  /**
   * Hands a URL to the operating system by following a link with target="_blank".
   *
   * The link is not attached to the page for long, and it is removed again once it has been
   * followed, so that it cannot be seen or activated by the user.
   */
  export function openExternalLink(url: string): void {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.hidden = true;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
