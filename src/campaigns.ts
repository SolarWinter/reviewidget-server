import { Request, ResponseToolkit, ServerRoute } from "@hapi/hapi";

import moment from "moment";

import { getCampaignsForUser, getCampaignById, getSiteById } from "./queries";
import { Campaign } from "./queries";

declare module "@hapi/hapi" {
  interface AuthCredentials {
    id: string;
    email: string;
  }
};

async function showCampaigns(request: Request, h: ResponseToolkit ) {
  const campaigns: Campaign[] = await getCampaignsForUser(request.auth.credentials.id);
  console.log("campaigns", campaigns);
  return h.view("campaigns", { campaigns: campaigns });
}

async function addCampaignRender(_request: Request, h: ResponseToolkit) {
  return h.view("addCampaigh");
}

async function addCampaignPost(request: Request, h: ResponseToolkit) {
  // try {
  //   const incoming: Campaign = (request.payload as Campaign);
  //   let siteDetails: Campaign = {
  //     domain: incoming.domain,
  //     reviewCampaignName: incoming.reviewCampaignName,
  //     reviewCampaignUrl: incoming.reviewCampaignUrl,
  //     reviewThreshold: incoming.reviewThreshold,
  //     thankText: incoming.thankText,
  //     // TODO make it a checkbox
  //     active: true
  //   };
  //   const id = await createCampaign(request, siteDetails);
  //   return h.redirect("/sites/" + id);
  // } catch (err) {
  //   console.error("error", err);
  //   request.log(["error"], "Error adding site");
  //   // TODO Find what the failure was
  //   return h.view("addsite");
  // }
  return "OK";
}

async function showCampaign(request: Request, h: ResponseToolkit) {
  const campaign: Campaign = await getCampaignById(request.params.campaignId);
  const site = await getSiteById(campaign.site_id, request.auth.credentials.id);
  return h.view("campaign", { campaign: { ...campaign, domain: site.domain }, moment: moment});
}

async function deleteCampaignRender(request: Request, h: ResponseToolkit) {
  const campaign: Campaign = await getCampaignById(request.params.campaignId);
  const u = new URL(request.headers.referer);
  return h.view("deleteCampaign", { campaign: campaign, previousUrl: u.pathname });
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
];
