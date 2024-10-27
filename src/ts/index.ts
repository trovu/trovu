import Home from "./modules/Home";

const home = new Home();
document.querySelector("body").onload = () => home.initialize();
