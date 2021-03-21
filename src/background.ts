import { Site } from "./queries";

import { getAllSites } from "./queries";
import { server } from "./server";
import { verifySite } from "./sites";

let domainCheckId: NodeJS.Timeout;

export async function verifySites() {
  const sites: Site[] = await getAllSites();
  if (process.env.NODE_ENV === "production") {
    server.log(["background", "verification"], `domainCheck - verifying ${sites.length} sites`);
  }
  sites.forEach(site => verifySite(site))
  if (process.env.NODE_ENV === "production") {
    server.log(["background", "verification"], `domainCheck - finished verifying ${sites.length} sites`);
  }
}

export async function initBackground() {
  // domainCheckId = null;
  return Promise.resolve(null);
}

export function startBackground() {
  const SECOND = 1000;
  const period: number = parseInt(process.env.DOMAIN_VERIFY_PERIOD_SECONDS || "300");
  console.log(`Starting domainCheck, period ${period} seconds`);

  domainCheckId = setInterval(verifySites, SECOND * period);
}

export function stopBackground() {
  if (domainCheckId)  {
    clearInterval(domainCheckId);
  }
}