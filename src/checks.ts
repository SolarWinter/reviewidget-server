import { Request, ResponseToolkit } from "@hapi/hapi";
import Boom from "@hapi/boom";

import { Campaign, Site } from "./queries";
import { getCampaignById, getSiteById } from "./queries";

export async function checkSite(request: Request, h: ResponseToolkit): Promise<symbol | Site> {
  if (request.auth.credentials.id === undefined) {
    throw Boom.unauthorized("Log in first");
  }
  if (!request.params.siteId) {
    console.log("No siteId, continue");
    return h.continue;
  }

  try {
    return await getSiteById(request.auth.credentials.id, request.params.siteId);
  } catch (err) {
    throw Boom.notFound("Can't find that site for that user");
  }
}
export const checkSitePre = { method: checkSite, assign: "site" };

export async function checkCampaign(request: Request, h: ResponseToolkit): Promise<symbol | Campaign> {
  if (!request.params.campaignId) {
    console.log("No campaignId, continue");
    return h.continue;
  }

  try {
    return await getCampaignById(request.params.campaignId);
  } catch (err) {
    throw Boom.notFound("Can't find that campaign for that site");
  }
}
export const checkCampaignPre = { method: checkCampaign, assign: "campaign" };