import { Request, ResponseToolkit, ResponseObject } from "@hapi/hapi";

import Joi from "joi";
const ValidationError = Joi.ValidationError;

// TODO split into separate type file
import { Site } from "./queries";

import { createSite, deleteSite, updateSite } from "./queries";
import { getSiteById, getSitesForUser, getCampaignsForSiteId } from "./queries";
import moment from "moment";

declare module "@hapi/hapi" {
  interface AuthCredentials {
    id: string;
    email: string;
  }
}

const schema = Joi.object({
  user_id: Joi.number().required().positive(),
  domain: Joi.alternatives().required().try(Joi.string().domain(), Joi.string().ip()),
  active: Joi.boolean().required()
});

async function addSiteRender(_request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  return h.view("addsite");
}

async function addSitePost(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  try {
    const incoming: Site = (request.payload as Site);
    let siteDetails: Site = {
      user_id: parseInt(request.auth.credentials.id),
      domain: incoming.domain,
      active: incoming.active
    };
    const o = schema.validate(siteDetails, { stripUnknown: true });
    siteDetails = (o.value as Site);
    if (o.error) {
      throw o.error;
    }
    const id = await createSite(request, siteDetails);
    return h.redirect("/sites/" + id);
  } catch (err) {
    const errors: { [key: string]: string } = {};
    if (err instanceof ValidationError && err.isJoi) {
      for (const detail of err.details) {
        errors[detail.path[0]] = detail.message;
      }
    } else {
      console.error("error", err);
      request.log(["error", "sites"], "Error adding site");
    }

    return h.view("addsite", { errors: errors });
  }
}

async function showSites(request: Request, h: ResponseToolkit ): Promise<ResponseObject> {
  const sites = await getSitesForUser(request.auth.credentials.id);
  return h.view("sites", { sites: sites });
}

async function showSite(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  const site = await getSiteById(request.params.siteId, request.auth.credentials.id);
  const campaigns = await getCampaignsForSiteId(request.params.siteId);
  return h.view("site", { site: site, campaigns: campaigns, moment: moment });
}

async function deleteSiteRender(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  const site = await getSiteById(request.params.siteId, request.auth.credentials.id);
  const u = new URL(request.headers.referer);
  return h.view("deleteSite", { site: site, previousUrl: u.pathname });
}

interface UrlPayload {
  previousUrl: string;
}
async function deleteSitePost(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  const site = await getSiteById(request.params.siteId, request.auth.credentials.id);
  await deleteSite(request, site.id!, request.auth.credentials.id);
  return h.redirect((request.payload as UrlPayload).previousUrl);
}

async function editSiteRender(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  const site = await getSiteById(request.params.siteId, request.auth.credentials.id);
  return h.view("editSite", { site: site });
}

async function editSitePost(request: Request, h: ResponseToolkit): Promise<ResponseObject> {
  try {
    const incoming: Site = (request.payload as Site);
    const siteDetails: Site = {
      user_id: parseInt(request.auth.credentials.id),
      domain: incoming.domain,
      // TODO make it a checkbox
      active: true
    };
    const id = await updateSite(request, request.params.siteId, siteDetails);
    return h.redirect("/sites/" + id);
  } catch (err) {
    console.error("error", err);
    request.log(["error"], "Error adding site");
    // TODO Find what the failure was
    return h.view("addsite", { loggedIn: request.auth.isAuthenticated });
  }
}

export const siteRoutes = [
  {
    method: "GET",
    path: "/sites",
    handler: showSites
  },
  {
    method: "GET",
    path: "/sites/add",
    handler: addSiteRender
  },
  {
    method: "POST",
    path: "/sites/add",
    handler: addSitePost
  },
  {
    method: "GET",
    path: "/sites/{siteId}",
    handler: showSite
  },

  {
    method: "GET",
    path: "/sites/{siteId}/edit",
    handler: editSiteRender
  },
  {
    method: "POST",
    path: "/sites/{siteId}/edit",
    handler: editSitePost
  },

  {
    method: "GET",
    path: "/sites/{siteId}/delete",
    handler: deleteSiteRender
  },
  {
    method: "POST",
    path: "/sites/{siteId}/delete",
    handler: deleteSitePost
  }
]
