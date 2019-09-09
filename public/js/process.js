import Env from "./env.js";
import Handle from "./handle.js";
import Helper from "./helper.js";

document.querySelector("body").onload = async function(event) {
  let env = new Env();
  await env.populate();

  let handle = new Handle(env);
  let redirectUrl = await handle.getRedirectUrl();

  if (!redirectUrl) {
    let params = env.getParams();
    params.status = "not_found";
    let paramStr = Helper.jqueryParam(params);
    redirectUrl = "../index.html#" + paramStr;
  }

  if (env.debug) {
    Helper.log("Redirect to:   " + redirectUrl);
    return;
  }

  window.location.href = redirectUrl;
};
