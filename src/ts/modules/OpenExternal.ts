/**
 * Open a URL externally (outside the PWA) when it points to a different
 * origin than the current app. Falls back to normal navigation for
 * same-origin URLs (which should stay inside the PWA).
 *
 * Android 14 PWA ignores window.location.href and window.open for external
 * URLs, but respects a programmatically clicked anchor with target="_blank".
 */

function isExternal(url: string): boolean {
    try {
        const u = new URL(url, window.location.href);
        return u.origin !== window.location.origin;
    } catch {
        return false;
    }
}

export function navigate(url: string): void {
    if (isExternal(url)) {
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        window.location.href = url;
    }
}
