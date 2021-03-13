import { Request, ResponseToolkit, ServerRoute } from "@hapi/hapi";

import { getActiveCampaignsForDomain, addReview, getSiteByDomain } from "./queries";
import { Campaign } from "./queries";

import Joi from "joi";
const ValidationError = Joi.ValidationError;

let domainOpts = {};
if (process.env.NODE_ENV !== "production") {
  // Adjust the parameters for testing - mainly to allow 'localhost' through.
  domainOpts = {
    minDomainSegments: 1,
    tlds: { allow: false }
  }
}

const schema = Joi.object({
  site_id: Joi.number().required().positive(),
  domain: Joi.alternatives().required().try(Joi.string().domain(domainOpts), Joi.string().ip()),
  rating: Joi.number().required().positive(),
  remoteIp: Joi.string().required().ip()
});

// TODO do better
export async function handleReview(request: Request, h: ResponseToolkit): Promise<unknown> {
  const rating = request.query.rating;
  const domain = request.query.domain;
  const remoteIp = request.info.remoteAddress;

  try {
    const site = await getSiteByDomain(domain);
    const o = schema.validate({ site_id: site.id, domain: domain, rating: rating, remoteIp: remoteIp });
    if (o.error) {
      throw o.error;
    }

    request.log(["review"], `Received rating ${rating} for ${domain} from ${remoteIp}`);
    await addReview(domain, rating, remoteIp);

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
    const campaign = campaigns[Math.floor(Math.random() * (campaigns.length))];

    const returnData = {
      campaignId: campaign.id,
      reviewSiteUrl: campaign.reviewSiteUrl,
      reviewSiteName: campaign.reviewSiteName,
      reviewThreshold: campaign.reviewThreshold,
      thankText: campaign.thankText
    };
    return returnData;
  } catch (err) {
    if (err instanceof ValidationError && err.isJoi) {
      request.log(["error", "review", "validation"], "Validation failed");
      for (const detail of err.details) {
        request.log(["error", "review", "validation"], detail.message);
      }
      const response = h.response();
      response.code(422);
      return response;
    } else {
      request.log(["error", "reviews", "validation"], "Non-Joi error adding campaign");
      throw err;
    }
  }
}

export const reviewRoutes: ServerRoute[] = [
  {
    method: "GET",
    path: "/addReview",
    handler: handleReview,
    options: {
      cors: {
        origin: ['*']
      },
      auth: false
    }
  }
]
