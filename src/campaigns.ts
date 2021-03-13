import { Request, ResponseToolkit, ResponseObject, ServerRoute } from "@hapi/hapi";
import moment from "moment";

import Joi from "joi";
const ValidationError = Joi.ValidationError;

import { getCampaignsForUser, getCampaignById, getSiteById, getSitesForUser } from "./queries";
import { createCampaign, updateCampaign, deleteCampaign, getRedirectsForCampaign } from "./queries";
import { Campaign } from "./queries";

declare module "@hapi/hapi" {
  interface AuthCredentials {
    id: string;
    email: string;
  }
}

const schema = Joi.object({
  id: Joi.number().positive(),
  site_id: Joi.number().required().positive(),
  active: Joi.boolean().required(),
  reviewSiteName: Joi.string().required(),
  reviewSiteUrl: Joi.string().required().uri({
    scheme: [ "http", "https" ],
    domain: {}
  }),
  reviewThreshold: Joi.number().required().positive(),
  thankText: Joi.string().required(),
  start: Joi.date().less(Joi.ref('finish')).required(),
  finish: Joi.date().required()
});

async function showCampaigns(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  const campaigns: Campaign[] = await getCampaignsForUser(request.auth.credentials.id);
  return h.view("campaigns", { campaigns: campaigns });
}

async function showCampaign(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  const campaign: Campaign = await getCampaignById(request.params.campaignId);
  const site = await getSiteById(campaign.site_id, request.auth.credentials.id);
  const redirects = await getRedirectsForCampaign(request, request.params.campaignId);
  return h.view("campaign", { campaign: { ...campaign, domain: site.domain }, moment: moment, redirects: redirects});
}

async function addCampaignRender(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  type ContextType = {
    domains: { domain: string; id: number }[];
    siteId?: number | string;
    campaign: Campaign;
    // TODO can we improve on this?
    moment: unknown;
    errors?: {string:string}[];
  };

  const campaign = {} as Campaign;
  const sites = await getSitesForUser(request.auth.credentials.id, ["domain", "id"]);
  const siteList = sites.map(site => {
    return { domain: site.domain, id: site.id! }
  })
  const context: ContextType = { domains: siteList, campaign: campaign, moment: moment};
  if (request.query.site) {
    context["siteId"] = request.query.site;
  }
  return h.view("addCampaign", context);
}

async function addCampaignPost(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  let campaignDetails: Campaign = ({} as Campaign)
  try {
    campaignDetails = (request.payload as Campaign);
    const o = schema.validate(campaignDetails, { stripUnknown: true });
    console.log("o", o);
    if (o.error) {
      throw o.error;
    }
    campaignDetails = (o.value as Campaign);
    const id = await createCampaign(request, campaignDetails);
    request.log(`Created campaign id ${id}`);
    return h.redirect("/campaigns/" + id);
  } catch (err) {
    const errors: { [key: string]: string } = {};
    if (err instanceof ValidationError && err.isJoi) {
      for (const detail of err.details) {
        errors[detail.context!.key!] = detail.message;
      }
    } else {
      console.error("error", err);
      request.log(["error", "campaigns"], "Error adding campaign");
    }

    const domains = await getSitesForUser(request.auth.credentials.id, ["domain", "id"]);
    return h.view("addCampaign", { domains: domains, campaign: campaignDetails, errors: errors, moment: moment });
  }
}

async function deleteCampaignRender(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  const campaign: Campaign = await getCampaignById(request.params.campaignId);
  const u = new URL(request.headers.referer);
  const site = await getSiteById(campaign.site_id, request.auth.credentials.id);
  return h.view("deleteCampaign", { campaign: { ...campaign, domain: site.domain }, previousUrl: u.pathname, moment: moment });
}

async function deleteCampaignPost(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  // await deleteCampaign(request, site.id, request.auth.credentials.id);
  await deleteCampaign(request, request.params.campaignId);
  return h.redirect("/campaigns");
}

async function editCampaignRender(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  const campaign: Campaign = await getCampaignById(request.params.campaignId);
  const domains = await getSitesForUser(request.auth.credentials.id, ["domain", "id"]);
  return h.view("editCampaign", { campaign: campaign, domains: domains, moment: moment});
}

async function editCampaignPost(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  const campaignDetails: Campaign = {} as Campaign;
  try {
    let campaignDetails: Campaign = (request.payload as Campaign);
    const o = schema.validate(campaignDetails, { stripUnknown: true });
    if (o.error) {
      throw o.error;
    }
    campaignDetails = (o.value as Campaign);
    const id = await updateCampaign(request, request.params.campaignId, campaignDetails);
    return h.redirect("/campaigns/" + id);
  } catch (err) {
    const errors: { [key: string]: string } = {};
    if (err instanceof ValidationError && err.isJoi) {
      for (const detail of err.details) {
        errors[detail.context!.key!] = detail.message;
      }
    } else {
      console.error("error", err);
      request.log(["error", "campaigns"], "Error adding campaign");
    }

    return h.view("editCampaign", { loggedIn: request.auth.isAuthenticated, campaign: campaignDetails });
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
    path: "/campaigns/",
    handler: showCampaigns
  },
  {
    method: "GET",
    path: "/campaigns/{campaignId}",
    handler: showCampaign
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
