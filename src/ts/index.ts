import Home from "./modules/Home";
import UrlProcessor from "./modules/UrlProcessor";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js").catch((registrationError) => {
    console.warn("Service worker registration failed:", registrationError);
  });
}

const home = new Home();
home.initialize();

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  const anchor = target.closest('a[href^="http"]');
  if (anchor) {
    event.preventDefault();
    const url = (anchor as HTMLAnchorElement).href;
    if (UrlProcessor.isExternalUrl(url)) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
});
