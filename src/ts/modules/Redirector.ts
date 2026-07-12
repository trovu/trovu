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
    try {
      window.open(url, "_blank", "noopener,noreferrer");
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
