import { Site } from "./queries";

import { getAllSites } from "./queries";
import { server } from "./server";
import { verifySite } from "./sites";

let domainCheckId: NodeJS.Timeout | null = null;

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

export function initBackground(): void {
  domainCheckId = null;
}

export function startBackground(): void {
  const SECOND = 1000;
  const period: number = parseInt(process.env.DOMAIN_VERIFY_PERIOD_SECONDS || "300");
  console.log(`Starting domainCheck, period ${period} seconds`);

  domainCheckId = setInterval(verifySites, SECOND * period);
}

export function stopBackground(): void {
  if (domainCheckId)  {
    clearInterval(domainCheckId);
    domainCheckId = null;
  }
}