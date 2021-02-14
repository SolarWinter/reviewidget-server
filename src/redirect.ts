import { Request, ResponseToolkit, ServerRoute } from "@hapi/hapi";

import { getSiteByDomain, addRedirectEntry } from "./queries";

export async function handleRedirect(request: Request, h: ResponseToolkit) {
  const domain = request.query.domain;
  const remoteIp = request.info.remoteAddress;

  request.log(["review"], `Received redirect for ${domain} from ${remoteIp}`);
  let data = await getSiteByDomain(domain);

  // TODO randomise if we get an array
  if (data.length >= 1) {
    data = data[0];
  }

  if (data.active) {
    request.log(["info", "review"], `Redirecting to ${data.reviewSiteUrl}`);
    await addRedirectEntry(data.id, remoteIp);
    return h.redirect(data.reviewSiteUrl);
  } else {
    const response = h.response("not found");
    response.code(404);
    return response;
  }
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
