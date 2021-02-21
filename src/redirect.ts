import { Request, ResponseToolkit, ServerRoute } from "@hapi/hapi";

import { getActiveCampaignsForDomain, addRedirectEntry } from "./queries";
import { Campaign } from "./queries";

export async function handleRedirect(request: Request, h: ResponseToolkit) {
  const domain = request.query.domain;
  const remoteIp = request.info.remoteAddress;

  request.log(["review"], `Received redirect for ${domain} from ${remoteIp}`);
  const campaigns: Campaign[] = await getActiveCampaignsForDomain(domain);
  if (campaigns.length == 0) {
    // No active campaigns
    const response = h.response()
    response.code(404);
    return response;
  }

  // Pick a random campaign
  // From https://www.w3schools.com/JS/js_random.asp:
  // Math.floor(Math.random() * (max - min) ) + min;
  let campaign = campaigns[Math.floor(Math.random() * (campaigns.length))];

  request.log(["info", "review"], `Redirecting to ${campaign.reviewSiteUrl}`);
  // Tell Typescript we know the ID will be present (as it's read from the database).
  await addRedirectEntry(campaign.id!, remoteIp);
  return h.redirect(campaign.reviewSiteUrl);
}

export const redirectRoutes: ServerRoute[] = [
  {
    method: "GET",
    path: "/redirect",
    handler: handleRedirect,
    options: {
      cors: {
        origin: ['*']
      },
      auth: false
    }
  }
]
