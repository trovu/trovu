import Home from "./modules/Home";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js").catch((registrationError) => {
    console.warn("Service worker registration failed:", registrationError);
  });
}

const home = new Home();
home.initialize();
