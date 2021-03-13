import { Request, ResponseObject, ResponseToolkit, ServerRoute } from "@hapi/hapi";
import iplocate from "node-iplocate";
import { Boom } from "@hapi/boom";
import Joi from "joi";

import { getCampaignById, addRedirectEntry } from "./queries";
import { Campaign } from "./queries";

const schema = Joi.object({
  campaignId: Joi.number().required().positive()
})

export async function handleRedirect(request: Request, h: ResponseToolkit): Promise<ResponseObject | Boom> {
  const campaignId = request.query.campaignId;
  const remoteIp = request.info.remoteAddress;

  request.log(["review"], `Received redirect for campaign ${campaignId} from ${remoteIp}`);
  const o = schema.validate({ campaignId: campaignId })
  if (o.error) {
    // Skip the exception, there's only one thing to validate.
    request.log(["review", "validation"], "Campaign ID is missing or invalid.");
    const response = h.response()
    response.code(422);
    return response;
  }

  const campaign: Campaign = await getCampaignById(campaignId);
  if (!campaign.active) {
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
