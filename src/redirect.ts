import { Request, ResponseObject, ResponseToolkit, ServerRoute } from "@hapi/hapi";
import iplocate from "node-iplocate";

import { LookupResult } from "node-iplocate";

import { getCampaignById, addRedirectEntry } from "./queries";
import { Campaign } from "./queries";

export async function handleRedirect(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  const domain = request.query.domain;
  const campaignId = request.query.campaignId;
  const remoteIp = request.info.remoteAddress;

  request.log(["review"], `Received redirect for ${domain} from ${remoteIp}`);
  if (!campaignId) {
    const response = h.response();
    response.code(404);
    return response;
  }

  const campaign: Campaign = await getCampaignById(campaignId);
  if (!campaign || !campaign.active) {
    // No active campaigns
    const response = h.response()
    response.code(404);
    return response;
  }

  const geoIpData: LookupResult = await iplocate(remoteIp);

  request.log(["info", "review"], `Redirecting to ${campaign.reviewSiteUrl}`);
  // Tell Typescript we know the ID will be present (as it's read from the database).
  await addRedirectEntry(campaign.id!, remoteIp, geoIpData);
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
