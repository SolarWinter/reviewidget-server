import { init, start } from "./server";
import { initBackground, startBackground } from "./background";

init().then(() => start());

initBackground();
startBackground();