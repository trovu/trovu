import Env from "./env.js";
import HandleCall from "./handleCall.js";
import Helper from "./helper.js";

function handleNotFound(env) {
  const params = Helper.getParams();
  params.status = "not_found";
  const paramStr = Helper.jqueryParam(params);
  const redirectUrl = "../index.html#" + paramStr;
  return redirectUrl;
}

/**
 * Rewrite browser history to make Back button work properly.
 */
function rewriteBrowserHistory() {
  const currentUrlWithoutProcess = window.location.href.replace('process\/', '');
  history.replaceState({}, "trovu.net", currentUrlWithoutProcess);
}

async function handle() {
  const env = new Env();
  await env.populate();

  const handleCall = new HandleCall(env);
  let redirectUrl = await handleCall.getRedirectUrl();

  if (!redirectUrl) {
    redirectUrl = handleNotFound(env);
  }

  if (env.debug) {
    Helper.log("Redirect to:   " + redirectUrl);
    return;
  }

  rewriteBrowserHistory();

  window.location.href = redirectUrl;
};

document.querySelector("body").onload = handle;