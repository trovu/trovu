import Env from "./env.js";
import HandleCall from "./handleCall.js";
import Helper from "./helper.js";


async function handle() {
  const env = new Env();
  await env.populate();

  const handleCall = new HandleCall(env);
  let redirectUrl = await handleCall.getRedirectUrl();

  if (!redirectUrl) {
    redirectUrl = handleCall.redirectNotFound(env);
  }

  if (env.debug) {
    Helper.log("Redirect to:   " + redirectUrl);
    return;
  }

  handleCall.rewriteBrowserHistory();

  window.location.href = redirectUrl;
};

document.querySelector("body").onload = handle;