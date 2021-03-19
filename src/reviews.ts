import { Request, ResponseToolkit, ServerRoute } from "@hapi/hapi";

import { getActiveCampaignsForDomain, addReview } from "./queries";
import { Campaign } from "./queries";

// TODO do better
export async function handleReview(request: Request, h: ResponseToolkit): Promise<unknown> {
  const rating = request.query.rating;
  const domain = request.query.domain;
  const remoteIp = request.info.remoteAddress;

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
