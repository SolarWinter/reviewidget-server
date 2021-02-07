import { Request } from "@hapi/hapi";

import { getSite, addReview } from "./queries";

export async function handleReview(request: Request) {
  const rating = request.query.rating;
  const domain = request.query.domain;
  const remoteIp = request.info.remoteAddress;

  request.log(["debug", "review"], `Received rating ${rating} for ${domain} from ${remoteIp}`);
  await addReview(domain, rating, remoteIp);

  let data = await getSite(domain);
  // TODO randomise if we get an array
  if (data.length >= 1) {
    data = data[0];
  }

  if (data.active) {
    const returnData = {
      reviewSiteUrl: data.reviewSiteUrl,
      reviewSiteName: data.reviewSiteName,
      reviewThreshold: data.reviewThreshold,
      thankText: data.thankText
    };
    request.log(["info"], returnData)
    return returnData;
  } else {
    return { thankText: data.thankText };
  }
}

export const reviewRoutes = [
  {
    method: "GET",
    path: "/addReview",
    handler: handleReview,
    options: {
      cors: {
        origin: ['*']
      }
    }
  }
]