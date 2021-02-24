import { Request, ResponseToolkit, ResponseObject, ServerRoute } from "@hapi/hapi";

import moment from "moment";

import { getCampaignsForUser, getCampaignById, getSiteById, getSitesForUser } from "./queries";
import { createCampaign, updateCampaign, deleteCampaign } from "./queries";
import { Campaign, Site } from "./queries";

declare module "@hapi/hapi" {
  interface AuthCredentials {
    id: string;
    email: string;
  }
}

async function showCampaigns(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  const campaigns: Campaign[] = await getCampaignsForUser(request.auth.credentials.id);
  return h.view("campaigns", { campaigns: campaigns });
}

async function showCampaign(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  const campaign: Campaign = await getCampaignById(request.params.campaignId);
  const site = await getSiteById(campaign.site_id, request.auth.credentials.id);
  return h.view("campaign", { campaign: { ...campaign, domain: site.domain }, moment: moment});
}

async function addCampaignRender(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  type ContextType = {
    domains: string[];
    siteId?: number | string;
    campaign: object;
    moment: object;
  };

  const domains = await getSitesForUser(request.auth.credentials.id, ["domain", "id"]);
  const context: ContextType = { domains: domains, campaign: {}, moment: moment};
  if (request.query.site) {
    context["siteId"] = request.query.site;
  }
  return h.view("addCampaign", context);
}

async function addCampaignPost(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  let campaignDetails: Campaign = {} as Campaign;
  try {
    const incoming: Campaign = (request.payload as Campaign);
    campaignDetails = {
      site_id: incoming.site_id,
      reviewSiteName: incoming.reviewSiteName,
      reviewSiteUrl: incoming.reviewSiteUrl,
      reviewThreshold: incoming.reviewThreshold,
      thankText: incoming.thankText,
      start: incoming.start,
      finish: incoming.finish,
      active: incoming.active
    };
    console.log("campaignDetails:", campaignDetails);
    const id = await createCampaign(request, campaignDetails);
    request.log(`Created campaign id ${id}`);
    return h.redirect("/campaigns/" + id);
  } catch (err) {
    console.error("error", err);
    request.log(["error"], "Error adding campaign");
    const domains = await getSitesForUser(request.auth.credentials.id, ["domain", "id"]);
    // TODO Find what the failure was
    // TODO send back the data they submitted to re-fill the form
    return h.view("addcampaign", { domains: domains, campaign: campaignDetails });
  }
}

async function deleteCampaignRender(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  const campaign: Campaign = await getCampaignById(request.params.campaignId);
  const u = new URL(request.headers.referer);
  return h.view("deleteCampaign", { campaign: campaign, previousUrl: u.pathname });
}

async function deleteCampaignPost(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  // await deleteCampaign(request, site.id, request.auth.credentials.id);
  await deleteCampaign(request, request.params.campaignId);
  return h.redirect("/campaigns");
}

async function editCampaignRender(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  const campaign: Campaign = await getCampaignById(request.params.campaignId);
  const domains = await getSitesForUser(request.auth.credentials.id, ["domain", "id"]);
  const site = await getSiteById(campaign.site_id, request.auth.credentials.id);
  console.log("editCampaignRender - rendering data", { campaign: campaign, domains: domains, moment: moment });
  return h.view("editCampaign", { campaign: campaign, domains: domains, moment: moment});
}

async function editCampaignPost(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  let campaignDetails: Campaign = {} as Campaign;
  let site: Site = {} as Site;
  try {
    const incoming: Campaign = (request.payload as Campaign);
    site = await getSiteById(incoming.site_id, request.auth.credentials.id);
    campaignDetails = {
      site_id: incoming.site_id,
      reviewSiteName: incoming.reviewSiteName,
      reviewSiteUrl: incoming.reviewSiteUrl,
      reviewThreshold: incoming.reviewThreshold,
      thankText: incoming.thankText,
      start: incoming.start,
      finish: incoming.finish,
      active: incoming.active
    };
    const id = await updateCampaign(request, request.params.campaignId, campaignDetails);
    return h.redirect("/campaigns/" + id);
  } catch (err) {
    console.error("error", err);
    request.log(["error"], "Error adding campaign");
    // TODO Find what the failure was
    return h.view("editCampaign", { loggedIn: request.auth.isAuthenticated, campaign: { ...campaignDetails, domain: site.domain } });
  }
}

export const campaignRoutes: ServerRoute[] = [
  {
    method: "GET",
    path: "/campaigns",
    handler: showCampaigns
  },
  {
    method: "GET",
    path: "/campaigns/add",
    handler: addCampaignRender
  },
  {
    method: "POST",
    path: "/campaigns/add",
    handler: addCampaignPost
  },
  {
    method: "GET",
    path: "/campaigns/{campaignId}",
    handler: showCampaign
  },

  {
    method: "GET",
    path: "/campaigns/{campaignId}/edit",
    handler: editCampaignRender
  },
  {
    method: "POST",
    path: "/campaigns/{campaignId}/edit",
    handler: editCampaignPost
  },

  {
    method: "GET",
    path: "/campaigns/{campaignId}/delete",
    handler: deleteCampaignRender
  },
  {
    method: "POST",
    path: "/campaigns/{campaignId}/delete",
    handler: deleteCampaignPost
  }
];
