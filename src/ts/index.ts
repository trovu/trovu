import Home from "./modules/Home";
import UrlProcessor from "./modules/UrlProcessor";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js").catch((registrationError) => {
    console.warn("Service worker registration failed:", registrationError);
  });
}

document.addEventListener("click", (event) => {
  const target = event.target as HTMLElement;
  const anchor = target.closest("a[href]");
  if (!anchor) return;

  const href = anchor.getAttribute("href");
  if (!href) return;

  if (UrlProcessor.isExternalUrl(href)) {
    event.preventDefault();
    window.open(href, "_blank", "noopener,noreferrer");
  }
});

const home = new Home();
home.initialize();
