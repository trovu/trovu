/** @module Redirector */
export default class Redirector {
  static navigateTo(url: string, options: { replace?: boolean } = {}) {
    if (this.isStandalone() && this.isExternalUrl(url)) {
      this.escapeStandalone(url);
      return;
    }
    if (options.replace) {
      this.replaceHref(url);
    } else {
      this.assignHref(url);
    }
  }

  static assignHref(url: string) {
    window.location.href = url;
  }

  static replaceHref(url: string) {
    window.location.replace(url);
  }

  static escapeStandalone(url: string) {
    // Use a real anchor element so Android WebAPK opens the URL in the
    // system browser instead of navigating inside the PWA window.
    // window.open(..., "_blank") is insufficient on Android WebAPK — only a
    // genuine <a target="_blank"> click reliably escapes the app shell.
    try {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      this.assignHref(url);
    }
  }

  static isExternalUrl(url: string): boolean {
    try {
      return new URL(url, window.location.href).origin !== window.location.origin;
    } catch {
      return false;
    }
  }

  static isStandalone(): boolean {
    if (typeof window === "undefined") {
      return false;
    }
    if ((window.navigator as unknown as { standalone?: boolean }).standalone === true) {
      return true;
    }
    if (typeof window.matchMedia === "function") {
      return window.matchMedia("(display-mode: standalone)").matches;
    }
    return false;
  }
}
