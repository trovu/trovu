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

document.querySelector("body").onload = async function(event) {
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

  // Rewrite browser history to make Back button work properly.
  const currentUrlWithoutProcess = window.location.href.replace('process\/', '');
  history.replaceState({}, "trovu.net", currentUrlWithoutProcess);

  window.location.href = redirectUrl;
};