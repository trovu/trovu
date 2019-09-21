import Env from "./env.js";
import Handle from "./handle.js";
import Helper from "./helper.js";

document.querySelector("body").onload = async function(event) {
  const env = new Env();
  await env.populate();

  const handle = new Handle(env);
  let redirectUrl = await handle.getRedirectUrl();

  if (!redirectUrl) {
    redirectUrl = handleNotFound(env);
  }

  if (env.debug) {
    Helper.log("Redirect to:   " + redirectUrl);
    return;
  }

  window.location.href = redirectUrl;
};

function handleNotFound(env) {
  const params = Helper.getParams();
  params.status = "not_found";
  const paramStr = Helper.jqueryParam(params);
  const redirectUrl = "../index.html#" + paramStr;
  return redirectUrl;
}