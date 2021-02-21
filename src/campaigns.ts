import { Request, ResponseToolkit, ServerRoute } from "@hapi/hapi";

import moment from "moment";

import { getCampaignsForUser, getCampaignById, getSiteById, getSitesForUser } from "./queries";
import { createCampaign, updateCampaign, deleteCampaign } from "./queries";
import { Campaign } from "./queries";

declare module "@hapi/hapi" {
  interface AuthCredentials {
    id: string;
    email: string;
  }
};

async function showCampaigns(request: Request, h: ResponseToolkit ) {
  const campaigns: Campaign[] = await getCampaignsForUser(request.auth.credentials.id);
  return h.view("campaigns", { campaigns: campaigns });
}

async function showCampaign(request: Request, h: ResponseToolkit) {
  const campaign: Campaign = await getCampaignById(request.params.campaignId);
  const site = await getSiteById(campaign.site_id, request.auth.credentials.id);
  return h.view("campaign", { campaign: { ...campaign, domain: site.domain }, moment: moment});
}

async function addCampaignRender(request: Request, h: ResponseToolkit) {
  const domains = await getSitesForUser(request.auth.credentials.id, ["domain", "id"]);
  return h.view("addCampaign", { domains: domains });
}

async function addCampaignPost(request: Request, h: ResponseToolkit) {
  try {
    const incoming: Campaign = (request.payload as Campaign);
    let campaignDetails: Campaign = {
      site_id: incoming.site_id,
      reviewSiteName: incoming.reviewSiteName,
      reviewSiteUrl: incoming.reviewSiteUrl,
      reviewThreshold: incoming.reviewThreshold,
      thankText: incoming.thankText,
      start: incoming.start,
      finish: incoming.finish,
      // TODO make it a checkbox
      active: true
    };
    const id = await createCampaign(request, campaignDetails);
    request.log(`Created campaign id ${id}`);
    return h.redirect("/campaigns/" + id);
  } catch (err) {
    console.error("error", err);
    request.log(["error"], "Error adding campaign");
    // TODO Find what the failure was
    return h.view("addcampaign");
  }
}

async function deleteCampaignRender(request: Request, h: ResponseToolkit) {
  const campaign: Campaign = await getCampaignById(request.params.campaignId);
  const u = new URL(request.headers.referer);
  return h.view("deleteCampaign", { campaign: campaign, previousUrl: u.pathname });
}

async function deleteCampaignPost(request: Request, h: ResponseToolkit) {
  // await deleteCampaign(request, site.id, request.auth.credentials.id);
  await deleteCampaign(request, request.params.campaignId);
  return h.redirect("/campaigns");
}

async function editCampaignRender(request: Request, h: ResponseToolkit) {
  const campaign: Campaign = await getCampaignById(request.params.campaignId);
  const domains = await getSitesForUser(request.auth.credentials.id, ["domain", "id"]);
  return h.view("editCampaign", { campaign: campaign, domains: domains });
}

async function editCampaignPost(request: Request, h: ResponseToolkit) {
  try {
    const incoming: Campaign = (request.payload as Campaign);
    let campaignDetails: Campaign = {
      site_id: incoming.site_id,
      reviewSiteName: incoming.reviewSiteName,
      reviewSiteUrl: incoming.reviewSiteUrl,
      reviewThreshold: incoming.reviewThreshold,
      thankText: incoming.thankText,
      start: incoming.start,
      finish: incoming.finish,
      // TODO make it a checkbox
      active: true
    };
    const id = await updateCampaign(request, request.params.campaignId, campaignDetails);
    return h.redirect("/campaigns/" + id);
  } catch (err) {
    console.error("error", err);
    request.log(["error"], "Error adding campaign");
    // TODO Find what the failure was
    return h.view("editCampaign", { loggedIn: request.auth.isAuthenticated });
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
